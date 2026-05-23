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

  // Endpoint per aggiornare le prestazioni scelte da un operatore specifico
  @Post('aggiorna-operatore/:operatoreId')
  async aggiornaPrestazioniOperatore(
    @Param('operatoreId') operatoreId: string,
    @Body() body: { prestazioneIds: string[] }
  ) {
    // Cerco l'operatore nel DB insieme alle sue vecchie prestazioni
    const operatore = await this.userRepository.findOne({
        where: { id: operatoreId },
        relations: {
            prestazioni: true
        }
    });

    if (!operatore) {
      return { success: false, message: 'Operatore non trovato' };
    }

    // Se l'array di ID è vuoto, svuoto la lista dell'operatore, altrimenti cerco le entità corrispondenti
    if (body.prestazioneIds.length === 0) {
      operatore.prestazioni = [];
    } else {
      // Tramite TypeORM cerco tutte le prestazioni incluse nell'elenco di ID inviati dal frontend
      operatore.prestazioni = await this.prestazioniService.findManyByIds(body.prestazioneIds);
    }

    await this.userRepository.save(operatore);

    return { 
      success: true, 
      message: 'Prestazioni aggiornate con successo!', 
      user: operatore
    };
  }
}