import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppuntamentiService } from './appuntamenti.service';

@ApiTags('Appuntamenti')
@ApiBearerAuth()
@Controller('appuntamenti')
export class AppuntamentiController {
  constructor(private readonly appuntamentiService: AppuntamentiService) {}

  @ApiOperation({ summary: 'Crea una nuova prenotazione' })
  @Post('prenota')
  async prenota(@Body() body: { data: string; ora: string; clienteId: string; operatoreId: string; prestazioneId: string; note?: string }) {
    return await this.appuntamentiService.creaAppuntamento(body);
  }

  @ApiOperation({ summary: 'Restituisce gli operatori disponibili per una prestazione in un dato giorno con i relativi slot orari liberi' })
  @ApiQuery({ name: 'giorno', description: 'Giorno della settimana (1=Lunedì … 7=Domenica)' })
  @ApiQuery({ name: 'prestazioneId', description: 'UUID della prestazione selezionata' })
  @ApiQuery({ name: 'data', description: 'Data in formato YYYY-MM-DD' })
  @Get('operatori-disponibili')
  async getOperatoriDisponibili(
    @Query('giorno') giorno: string,
    @Query('prestazioneId') prestazioneId: string,
    @Query('data') data: string
  ) {
    return await this.appuntamentiService.trovaOperatoriDisponibili(
      parseInt(giorno),
      prestazioneId,
      data
    );
  }

  @ApiOperation({ summary: 'Restituisce tutti gli appuntamenti di un cliente' })
  @Get('cliente/:id')
  async getPerCliente(@Param('id') id: string) {
    return await this.appuntamentiService.findByCliente(id);
  }

  @ApiOperation({ summary: 'Restituisce tutti gli appuntamenti di un operatore' })
  @Get('operatore/:id')
  async getPerOperatore(@Param('id') id: string) {
    return await this.appuntamentiService.findByOperatore(id);
  }

  @ApiOperation({ summary: 'Aggiorna lo stato di un appuntamento (confermato / rifiutato)' })
  @Patch(':id/stato')
  async cambiaStato(
    @Param('id') id: string,
    @Body('stato') stato: 'in attesa' | 'confermato' | 'rifiutato'
  ) {
    await this.appuntamentiService.aggiornaStato(id, stato);
    return { success: true, message: 'Stato aggiornato con successo!' };
  }

  @ApiOperation({ summary: 'Elimina un appuntamento' })
  @Delete(':id')
  async eliminaAppuntamento(@Param('id') id: string) {
    await this.appuntamentiService.elimina(id);
    return { success: true, message: 'Appuntamento eliminato con successo!' };
  }
}