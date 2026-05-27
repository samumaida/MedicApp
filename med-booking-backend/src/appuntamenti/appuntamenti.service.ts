import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Appuntamento } from './entities/appuntamento.entity';
import { OperatorePrestazione } from '../prestazioni/entities/operatore-prestazione.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AppuntamentiService {
  constructor(
    @InjectRepository(Appuntamento)
    private readonly appuntamentoRepository: Repository<Appuntamento>,
    @InjectRepository(OperatorePrestazione)
    private readonly operatorePrestazioneRepository: Repository<OperatorePrestazione>,
  ) {}

  async creaAppuntamento(dati: any) {
    /** 
     * Controllo che l'operatore non abbia già un appuntamento
     * attivo nello stesso giorno e alla stessa ora
     */ 
    const sovrapposizione = await this.appuntamentoRepository.findOne({
      where: {
        operatore: { id: dati.operatoreId },
        data: dati.data,
        ora: dati.ora,
        stato: Not('rifiutato'),
      },
    });

    if (sovrapposizione) {
      throw new ConflictException(
        'Questo orario è già stato prenotato da un altro paziente. Scegli un orario diverso.'
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
  async trovaOperatoriDisponibili(categoriaId: string, giornoSettimana: number, prestazioneId: string, data: string) {
    try {
      const associazioni = await this.operatorePrestazioneRepository.find({
        where: {
          prestazione: { id: prestazioneId }
        },
        relations: {
          operatore: true
        }
      });

      const risultati: any[] = [];

      for (const assoc of associazioni) {
        const medico = assoc.operatore;

        if (!medico || medico.ruolo !== UserRole.OPERATORE) continue;

        // Cerco il turno del medico per il giorno della settimana richiesto
        const turnoOggi = medico.giorniDisponibili?.find(
          (t: { giorno: number; inizio: string; fine: string }) => t.giorno === giornoSettimana
        );

        if (!turnoOggi) continue; // Se il medico non lavora quel giorno, passo al prossimo

        // Genero tutti gli slot teorici del turno
        const tuttiGliSlot = this.generaSlot(turnoOggi.inizio, turnoOggi.fine, assoc.durataMinuti);

        // Recupero le prenotazioni esistenti dell'operatore per quella data (escluse le rifiutate)
        const prenotazioniEsistenti = await this.appuntamentoRepository.find({
          where: {
            operatore: { id: medico.id },
            data: data,
            stato: Not('rifiutato'),
          },
        });

        const oreOccupate = prenotazioniEsistenti.map(p => p.ora);

        // Tengo solo gli slot ancora liberi
        const orariLiberi = tuttiGliSlot.filter(slot => !oreOccupate.includes(slot));

        // Aggiungo il medico alla lista solo se ha almeno uno slot disponibile
        if (orariLiberi.length > 0) {
          risultati.push({
            id: medico.id,
            nome: `Dott. ${medico.nome} ${medico.cognome}`,
            specializzazione: medico.specializzazione,
            prezzo: assoc.prezzo,
            durataMinuti: assoc.durataMinuti,
            orari: orariLiberi,
          });
        }
      }

      return risultati;

    } catch (error) {
      console.error('Errore nel recupero degli operatori disponibili:', error);
      throw new BadRequestException('Impossibile recuperare i medici disponibili per questa combinazione.');
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