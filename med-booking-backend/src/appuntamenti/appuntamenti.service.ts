import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Appuntamento } from './entities/appuntamento.entity';
import { OperatorePrestazione } from '../prestazioni/entities/operatore-prestazione.entity';
import { Prestazione } from '../prestazioni/entities/prestazione.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreaAppuntamentoDto, OperatoreDisponibileDto } from './dto/appuntamenti.dto';
import { TurnoDisponibile } from '../common/types';

@Injectable()
export class AppuntamentiService {
  constructor(
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,
    @InjectRepository(OperatorePrestazione)
    private readonly operatorePrestazioneRepository: Repository<OperatorePrestazione>,
    @InjectRepository(Prestazione)
    private readonly prestazioneRepository: Repository<Prestazione>,
  ) {}

  // Converte l'orario in minuti totali dall'inizio della giornata
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  // Verifica se i due intervalli (start1, start1+dur1 e start2, start2+dur2) si sovrappongono
  private siSovrappongono(start1: number, dur1: number, start2: number, dur2: number): boolean {
    return start1 < start2 + dur2 && start2 < start1 + dur1;
  }

  async creaAppuntamento(dati: CreaAppuntamentoDto) {
    // Recupero la durata della prestazione richiesta
    const prestazione = await this.prestazioneRepository.findOne({ where: { id: dati.prestazioneId } });
    const nuovaDurata = prestazione?.durataMinuti ?? 60;
    const nuovoInizio = this.timeToMinutes(dati.ora);

    // Carico tutti gli appuntamenti attivi dell'operatore per quel giorno con le loro prestazioni
    const appuntamentiEsistenti = await this.appuntamentoRepository.find({
      where: {
        operatore: { id: dati.operatoreId },
        data: dati.data,
        stato: Not('rifiutato'),
      },
      relations: { prestazione: true }
    });

    // Controllo la sovrapposizione con altri appuntamenti tenendo conto della durata di ciascun appuntamento
    const sovrapposizione = appuntamentiEsistenti.find(app => {
      const esistenteInizio = this.timeToMinutes(app.ora);
      const esistenteDurata = app.prestazione?.durataMinuti ?? 60;
      return this.siSovrappongono(nuovoInizio, nuovaDurata, esistenteInizio, esistenteDurata);
    });

    if (sovrapposizione) {
      throw new ConflictException(
        'Questo orario si sovrappone a un appuntamento già esistente. Scegli un orario diverso.'
      );
    }

    try {
      const nuovoAppuntamento = this.appuntamentoRepository.create({
        data: dati.data,
        ora: dati.ora,
        note: dati.note,
        stato: 'in attesa',
        cliente: { id: dati.clienteId },
        operatore: { id: dati.operatoreId },
        prestazione: { id: dati.prestazioneId },
      });

      const salvato = await this.appuntamentoRepository.save(nuovoAppuntamento);
      return { success: true, message: 'Appuntamento prenotato con successo!', id: salvato.id };
    } catch (error) {
      console.error('Errore reale durante il salvataggio:', error);
      throw new BadRequestException('Impossibile salvare la prenotazione. Controlla i dati.');
    }
  }

  /**
   * Genera tutti gli slot orari possibili in un turno con una durata fissa in minuti.
   */
  private generaSlot(inizio: string, fine: string, durataMinuti: number): string[] {
    const slots: string[] = [];
    let [h, m] = inizio.split(':').map(Number);
    const [hFine, mFine] = fine.split(':').map(Number);
    const minutiFine = hFine * 60 + mFine;

    while (h * 60 + m + durataMinuti <= minutiFine) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += durataMinuti;
      h += Math.floor(m / 60);
      m = m % 60;
    }

    return slots;
  }

  /**
   * Cerco gli operatori disponibili in base alla prestazione, al giorno della settimana
   * e alla data specifica restituendo per ciascun operatore gli slot orari ancora liberi.
   */
  async trovaOperatoriDisponibili(giornoSettimana: number, prestazioneId: string, data: string) {
    try {
      const associazioni = await this.operatorePrestazioneRepository.find({
        where: {
          prestazione: { id: prestazioneId }
        },
        relations: {
          operatore: true
        }
      });

      const risultati: OperatoreDisponibileDto[] = [];

      for (const assoc of associazioni) {
        const operatore = assoc.operatore;

        if (!operatore || operatore.ruolo !== UserRole.OPERATORE) continue;

        // Cerco il turno dell'operatore per il giorno della settimana richiesto
        const turnoOggi = operatore.giorniDisponibili?.find(
          (t: TurnoDisponibile) => t.giorno === giornoSettimana
        );

        if (!turnoOggi) continue; // Se l'operatore non lavora quel giorno, passo al prossimo

        // Genero tutti gli slot teorici del turno
        const tuttiGliSlot = this.generaSlot(turnoOggi.inizio, turnoOggi.fine, assoc.durataMinuti);

        // Recupero le prenotazioni esistenti dell'operatore per quella data con le loro prestazioni
        const prenotazioniEsistenti = await this.appuntamentoRepository.find({
          where: {
            operatore: { id: operatore.id },
            data: data,
            stato: Not('rifiutato'),
          },
          relations: { prestazione: true }
        });

        // Filtro gli slot liberi controllando la sovrapposizione con la durata di ogni appuntamento
        const orariLiberi = tuttiGliSlot.filter(slot => {
          const slotInizio = this.timeToMinutes(slot);
          return !prenotazioniEsistenti.some(app => {
            const appInizio = this.timeToMinutes(app.ora);
            const appDurata = app.prestazione?.durataMinuti ?? 60;
            return this.siSovrappongono(slotInizio, assoc.durataMinuti, appInizio, appDurata);
          });
        });

        // Aggiungo l'operatore alla lista solo se ha almeno uno slot disponibile
        if (orariLiberi.length > 0) {
          risultati.push({
            id: operatore.id,
            nome: `Dott. ${operatore.nome} ${operatore.cognome}`,
            specializzazione: operatore.specializzazione,
            prezzo: assoc.prezzo,
            durataMinuti: assoc.durataMinuti,
            orari: orariLiberi,
          });
        }
      }

      return risultati;

    } catch (error) {
      console.error('Errore nel recupero degli operatori disponibili:', error);
      throw new BadRequestException('Impossibile recuperare gli operatori disponibili per questa combinazione.');
    }
  }

  async aggiornaStato(id: string, stato: 'in attesa' | 'confermato' | 'rifiutato') {
    const appuntamento = await this.appuntamentoRepository.findOne({ where: { id } });
    
    if (!appuntamento) {
      throw new BadRequestException('Appuntamento non trovato.');
    }

    appuntamento.stato = stato;
    return await this.appuntamentoRepository.save(appuntamento);
  }

  // Salva il percorso del referto caricato dall'operatore
  async salvaReferto(id: string, refertoUrl: string): Promise<void> {
    const appuntamento = await this.appuntamentoRepository.findOne({ where: { id } });
    if (!appuntamento) {
      throw new BadRequestException('Appuntamento non trovato.');
    }
    appuntamento.refertoUrl = refertoUrl;
    await this.appuntamentoRepository.save(appuntamento);
  }

  async elimina(id: string): Promise<void> {
    const risultato = await this.appuntamentoRepository.delete(id);
    
    if (risultato.affected === 0) {
      throw new BadRequestException('Appuntamento non trovato o già eliminato.');
    }
  }

  async findByCliente(clienteId: string) {
    return await this.appuntamentoRepository.find({
      where: { cliente: { id: clienteId } },
      relations: {
        operatore: true,
        prestazione: true
      },
      order: { data: 'DESC', ora: 'ASC' }
    });
  }

  async findByOperatore(operatoreId: string) {
    return await this.appuntamentoRepository.find({
      where: { operatore: { id: operatoreId } },
      relations: {
        cliente: true,
        prestazione: true
      },
      order: { data: 'ASC', ora: 'ASC' }
    });
  }
}