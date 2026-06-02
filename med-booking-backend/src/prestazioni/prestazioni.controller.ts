import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrestazioniService } from './prestazioni.service';
import { AdminGuard } from '../auth/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { OperatorePrestazione } from './entities/operatore-prestazione.entity';
import { Categoria } from './entities/categoria.entity';
import { TurnoDisponibile } from '../common/types';

// Interfaccia DTO temporanea per "tipizzare" il body in arrivo dal frontend
interface AggiornaPrestazioniDto {
  prestazioni: {
    prestazioneId: string;
    durataMinuti: number;
    prezzo: number;
  }[];
}

@ApiTags('Prestazioni')
@ApiBearerAuth()
@Controller('prestazioni')
export class PrestazioniController {
  constructor(
    private readonly prestazioniService: PrestazioniService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OperatorePrestazione)
    private readonly operatorePrestazioneRepository: Repository<OperatorePrestazione>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    private dataSource: DataSource,
  ) {}

  @ApiOperation({ summary: 'Restituisce il catalogo completo delle prestazioni' })
  @Get()
  getAll() {
    return this.prestazioniService.findAll();
  }

  @ApiOperation({ summary: 'Restituisce le categorie di prestazioni disponibili' })
  @Get('categorie')
  getCategorie() {
    return this.categoriaRepository.find({ order: { nome: 'ASC' } });
  }

  @ApiOperation({ summary: 'Salva le prestazioni abilitate da un operatore con prezzo e durata personalizzati' })
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
      user: operatoreAggiornato
    };
  }

  @ApiOperation({ summary: 'Aggiorna specializzazione e orari di ricevimento di un operatore' })
  @Patch('operatore/:id/impostazioni-profilo')
  async aggiornaImpostazioniProfilo(
    @Param('id') id: string,
    @Body() body: { specializzazione: string; orariLavoro: TurnoDisponibile[] }
  ) {
    return await this.prestazioniService.salvaProfiloOperatore(id, body.specializzazione, body.orariLavoro);
  }

  @ApiOperation({ summary: 'Restituisce specializzazione e orari di ricevimento di un operatore' })
  @Get('operatore/:id/profilo')
  async getProfiloOperatore(@Param('id') id: string) {
    return await this.prestazioniService.trovaProfiloOperatore(id);
  }

  // Endpoint riservati all'admin

  @ApiOperation({ summary: '[ADMIN] Aggiunge una nuova prestazione al catalogo globale' })
  @UseGuards(AdminGuard)
  @Post()
  async creaPrestazione(@Body() body: { nome: string; descrizione?: string; categoriaId: string; durataMinuti: number; prezzo: number }) {
    return await this.prestazioniService.crea(body);
  }

  @ApiOperation({ summary: '[ADMIN] Modifica una prestazione esistente nel catalogo' })
  @UseGuards(AdminGuard)
  @Patch(':id')
  async aggiornaPrestazione(
    @Param('id') id: string,
    @Body() body: { nome?: string; descrizione?: string; categoriaId?: string; durataMinuti?: number; prezzo?: number }
  ) {
    return await this.prestazioniService.aggiorna(id, body);
  }

  @ApiOperation({ summary: '[ADMIN] Elimina una prestazione dal catalogo globale' })
  @UseGuards(AdminGuard)
  @Delete(':id')
  async eliminaPrestazione(@Param('id') id: string) {
    await this.prestazioniService.elimina(id);
    return { success: true, message: 'Prestazione eliminata con successo.' };
  }

  @ApiOperation({ summary: '[ADMIN] Crea una nuova categoria' })
  @UseGuards(AdminGuard)
  @Post('categorie')
  async creaCategoria(@Body() body: { id: string; nome: string; immagine?: string }) {
    return await this.categoriaRepository.save(body);
  }

  @ApiOperation({ summary: '[ADMIN] Modifica nome, id o immagine di una categoria esistente' })
  @UseGuards(AdminGuard)
  @Patch('categorie/:id')
  async aggiornaCategoria(
    @Param('id') id: string,
    @Body() body: { id?: string; nome?: string; immagine?: string }
  ) {
    // Se cambia l'ID aggiorno anche il categoriaId nelle prestazioni collegate
    if (body.id && body.id !== id) {
      await this.prestazioniService.aggiornaCategoriaId(id, body.id);
    }
    const { id: nuovoId, ...rest } = body;
    const categoriaAggiornata = { ...rest, ...(nuovoId ? { id: nuovoId } : {}) };
    await this.categoriaRepository.update(id, categoriaAggiornata);
    return await this.categoriaRepository.findOne({ where: { id: nuovoId ?? id } });
  }

  @ApiOperation({ summary: '[ADMIN] Elimina una categoria e dissocia le prestazioni collegate' })
  @UseGuards(AdminGuard)
  @Delete('categorie/:id')
  async eliminaCategoria(@Param('id') id: string) {
    // Dissocia le prestazioni collegate impostando categoriaId a null
    await this.prestazioniService.dissociaCategoria(id);
    await this.categoriaRepository.delete(id);
    return { success: true, message: 'Categoria eliminata. Le prestazioni collegate sono state dissociate.' };
  }
}