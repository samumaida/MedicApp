import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrestazioniService } from './prestazioni.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

@Controller('prestazioni')
export class PrestazioniController {
  constructor(
    private readonly prestazioniService: PrestazioniService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Endpoint per ottenere l'intero catalogo di prestazioni
  @Get()
  getAll() {
    return this.prestazioniService.findAll();
  }

  // Endpoint per aggiornare le prestazioni scelte da un medico specifico
  @Post('aggiorna-medico/:medicoId')
  async aggiornaPrestazioniMedico(
    @Param('medicoId') medicoId: string,
    @Body() body: { prestazioneIds: string[] }
  ) {
    // Cerco il medico nel DB insieme alle sue vecchie prestazioni
    const medico = await this.userRepository.findOne({
        where: { id: medicoId },
        relations: {
            prestazioni: true
        }
    });

    if (!medico) {
      return { success: false, message: 'Medico non trovato' };
    }

    // Se l'array di ID è vuoto, svuoto la lista del medico, altrimenti cerco le entità corrispondenti
    if (body.prestazioneIds.length === 0) {
      medico.prestazioni = [];
    } else {
      // Tramite TypeORM cerco tutte le prestazioni incluse nell'elenco di ID inviati dal frontend
      medico.prestazioni = await this.prestazioniService.findManyByIds(body.prestazioneIds);
    }

    await this.userRepository.save(medico);

    return { 
      success: true, 
      message: 'Prestazioni aggiornate con successo!', 
      user: medico
    };
  }
}