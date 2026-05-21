import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestazione } from './entities/prestazione.entity';
import { In } from 'typeorm';

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
        { nome: 'Visita Generale', descrizione: 'Controllo medico di routine', durataMinuti: 30, prezzo: 50.00 },
        { nome: 'Visita Cardiologica', descrizione: 'Elettrocardiogramma e controllo pressione', durataMinuti: 45, prezzo: 120.00 },
        { nome: 'Visita Oculistica', descrizione: 'Esame della vista e del fondo oculare', durataMinuti: 30, prezzo: 90.00 },
        { nome: 'Visita Dermatologica', descrizione: 'Mappatura dei nei e controllo cute', durataMinuti: 30, prezzo: 100.00 },
        { nome: 'Seduta Fisioterapica', descrizione: 'Riabilitazione e terapia manuale', durataMinuti: 60, prezzo: 70.00 },
      ];

      await this.prestazioneRepository.save(defaultPrestazioni);
      console.log('🌱 Database Seed: Prestazioni predefinite inserite con successo!');
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
}