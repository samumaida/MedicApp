import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestazione } from './entities/prestazione.entity';
import { In } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PrestazioniService implements OnModuleInit {
  constructor(
    @InjectRepository(Prestazione)
    private readonly prestazioneRepository: Repository<Prestazione>,
  ) {}

  // Questo metodo scatta da solo all'avvio del server NestJS
  async onModuleInit() {
    const count = await this.prestazioneRepository.count();
    if (count === 0) {
      const defaultPrestazioni = [
      // PEDIATRIA
      { nome: 'Test DNA Fetale', descrizione: 'Screening prenatale non invasivo del DNA libero.', durataMinuti: 30, prezzo: 400.00, categoriaId: 'pediatria' },
      { nome: 'Visita Pediatrica di Controllo', descrizione: 'Bilancio di salute e monitoraggio della crescita.', durataMinuti: 45, prezzo: 90.00, categoriaId: 'pediatria' },
      { nome: 'Ecografia Morfologica', descrizione: 'Controllo ecografico ostetrico dettagliato.', durataMinuti: 60, prezzo: 150.00, categoriaId: 'pediatria' },

      // CARDIOLOGIA
      { nome: 'Visita Cardiologica con ECG', descrizione: 'Valutazione specialistica con elettrocardiogramma.', durataMinuti: 45, prezzo: 120.00, categoriaId: 'cardiologia' },
      { nome: 'Ecocardiogramma color doppler', descrizione: 'Ecografia mirata allo studio delle strutture cardiache.', durataMinuti: 30, prezzo: 110.00, categoriaId: 'cardiologia' },
      { nome: 'Holter Cardiaco 24h', descrizione: 'Monitoraggio continuo del ritmo cardiaco.', durataMinuti: 20, prezzo: 80.00, categoriaId: 'cardiologia' },

      // DIAGNOSTICA
      { nome: 'Radiografia Toracica (RX)', descrizione: 'Esame radiologico standard del torace.', durataMinuti: 15, prezzo: 40.00, categoriaId: 'diagnostica' },
      { nome: 'Risonanza Magnetica Nucleare', descrizione: 'Studio ad alta risoluzione dei tessuti molli e articolazioni.', durataMinuti: 45, prezzo: 220.00, categoriaId: 'diagnostica' },
      { nome: 'Ecografia Addome Completo', descrizione: 'Screening ecografico degli organi addominali.', durataMinuti: 30, prezzo: 90.00, categoriaId: 'diagnostica' },

      // LABORATORIO
      { nome: 'Esami del Sangue Routine', descrizione: 'Emocromo completo, profilo lipidico e glicemico.', durataMinuti: 10, prezzo: 30.00, categoriaId: 'laboratorio' },
      { nome: 'Tampone Faringeo Microbiologico', descrizione: 'Ricerca colturale di batteri patogeni respiratori.', durataMinuti: 10, prezzo: 25.00, categoriaId: 'laboratorio' },

      // ORTOPEDIA
      { nome: 'Visita Ortopedica', descrizione: 'Consulto specialistico per patologie osteo-articolari.', durataMinuti: 30, prezzo: 100.00, categoriaId: 'ortopedia' },
      { nome: 'Seduta di Fisioterapia', descrizione: 'Trattamento di riabilitazione motoria personalizzato.', durataMinuti: 60, prezzo: 70.00, categoriaId: 'ortopedia' }
    ];

      await this.prestazioneRepository.save(defaultPrestazioni);
      console.debug('🌱 Database Seed: Catalogo esami allineato con successo!');
    }
  }

  // Ritorna tutto il catalogo disponibile
  async findAll(): Promise<Prestazione[]> {
    return await this.prestazioneRepository.find({ order: { nome: 'ASC' } });
  }

  async findManyByIds(ids: string[]): Promise<Prestazione[]> {
        return await this.prestazioneRepository.find({
            where: {
            id: In(ids)
            }
        });
    }

  async salvaProfiloMedico(id: string, specializzazione: string, orariLavoro: any[]) {
    try {
      await this.prestazioneRepository.manager.update(
        'User', 
        { id: id },
        { 
          specializzazione: specializzazione,
          giorniDisponibili: orariLavoro 
        }
      );
      return { success: true, message: 'Profilo e orari aggiornati con successo!' };
    } catch (error) {
      console.error('Errore durante il salvataggio delle impostazioni:', error);
      throw new BadRequestException('Impossibile salvare le impostazioni del profilo.');
    }
  }

  async trovaProfiloMedico(id: string) {
    try {
      const utente = await this.prestazioneRepository.manager.findOne(User, {
        where: { id: id } as any
      });

      if (!utente) {
        throw new BadRequestException('Operatore non trovato.');
      }

      return {
        id: utente.id,
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        ruolo: utente.ruolo,
        specializzazione: utente.specializzazione,
        giorniDisponibili: utente.giorniDisponibili || []
      };
    } catch (error) {
      console.error('Errore nel recupero del profilo:', error);
      throw new BadRequestException('Impossibile recuperare i dati del profilo.');
    }
  }
}