import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrestazioniService } from './prestazioni.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { OperatorePrestazione } from './entities/operatore-prestazione.entity';

// Interfaccia DTO temporanea per "tipizzare" il body in arrivo dal frontend
interface AggiornaPrestazioniDto {
  prestazioni: {
    prestazioneId: string;
    durataMinuti: number;
    prezzo: number;
  }[];
}

@Controller('prestazioni')
export class PrestazioniController {
  constructor(
    private readonly prestazioniService: PrestazioniService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OperatorePrestazione)
    private readonly operatorePrestazioneRepository: Repository<OperatorePrestazione>,
    private dataSource: DataSource,
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
    @Body() body: AggiornaPrestazioniDto
  ) {
    // Cerco l'operatore nel DB insieme alle sue vecchie prestazioni
    const operatore = await this.userRepository.findOne({ where: { id: operatoreId } });

    if (!operatore) {
      return { success: false, message: 'Operatore non trovato' };
    }

    // Uso una transazione salvando o tutto o niente per evitare dati orfani in caso di errore
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(OperatorePrestazione, { operatore: { id: operatoreId } });

      // Aggiorno le prestazioni con i dati dell'operatore
      if (body.prestazioni && body.prestazioni.length > 0) {
        const nuoveImpostazioni = body.prestazioni.map(item => {
          const rigaPivot = new OperatorePrestazione();
          rigaPivot.operatore = operatore;
          rigaPivot.prestazione = { id: item.prestazioneId } as any;
          rigaPivot.durataMinuti = item.durataMinuti;
          rigaPivot.prezzo = item.prezzo;
          return rigaPivot;
        });

        await queryRunner.manager.save(OperatorePrestazione, nuoveImpostazioni);
      }

      // Confermo le operazioni sul database
      await queryRunner.commitTransaction();

    } catch (err) {
      // In caso di problemi faccio il rollback per non sporcare il database
      await queryRunner.rollbackTransaction();
      return { success: false, message: 'Errore durante il salvataggio dei dati personalizzati' };
    } finally {
      await queryRunner.release();
    }

    // Recupero l'operatore aggiornato da restituire al frontend per aggiornare lo stato di Auth
    const operatoreAggiornato = await this.userRepository.findOne({
      where: { id: operatoreId },
      relations: {
        operatorePrestazioni: {
          prestazione: true
        }
      }
    });

    return { 
      success: true, 
      message: 'Prestazioni aggiornate con successo!', 
      user: operatore
    };
  }
}