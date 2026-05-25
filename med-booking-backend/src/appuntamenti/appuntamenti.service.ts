import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    try {
      const nuovoAppuntamento = this.appuntamentoRepository.create({
        data: dati.data,
        ora: dati.ora,
        note: dati.note,
        stato: 'in attesa', // Stato iniziale di default
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
   * Cerca gli operatori reali disponibili in base alla prestazione e al giorno della settimana
   */
  async trovaOperatoriDisponibili(categoriaId: string, giornoSettimana: number, prestazioneId: string) {
    try {
      // Interrogo la tabella pivot filtrando per la prestazione scelta
      const associazioni = await this.operatorePrestazioneRepository.find({
        where: {
          prestazione: { id: prestazioneId }
        },
        relations: {
          operatore: true
        }
      });

      // Filtro i medici che lavorano effettivamente quel giorno ed hanno il ruolo corretto
      const filtrati = associazioni.filter(assoc => {
        const medico = assoc.operatore;
        
        if (!medico) return false;

        const eUnOperatore = medico.ruolo === UserRole.OPERATORE;
        
        // Verifico se il giorno della settimana (1-7) è incluso nei suoi giorni di lavoro
        const lavoraOggi = medico.giorniDisponibili?.includes(giornoSettimana);

        return eUnOperatore && lavoraOggi;
      });

      return filtrati.map(assoc => ({
        id: assoc.operatore.id,
        nome: `Dott. ${assoc.operatore.nome} ${assoc.operatore.cognome}`,
        specializzazione: assoc.operatore.specializzazione,
        // Presi direttamente dalla pivot del singolo medico
        prezzo: assoc.prezzo,
        durataMinuti: assoc.durataMinuti
      }));

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