import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { AppuntamentiService } from './appuntamenti.service';

@Controller('appuntamenti')
export class AppuntamentiController {
  constructor(private readonly appuntamentiService: AppuntamentiService) {}

  @Post('prenota')
  async prenota(@Body() body: { data: string; ora: string; clienteId: string; operatoreId: string; prestazioneId: string; note?: string }) {
    return await this.appuntamentiService.creaAppuntamento(body);
  }

  @Get('operatori-disponibili')
  async getOperatoriDisponibili(
    @Query('categoriaId') categoriaId: string,
    @Query('giorno') giorno: string,
    @Query('prestazioneId') prestazioneId: string,
    @Query('data') data: string
  ) {
    return await this.appuntamentiService.trovaOperatoriDisponibili(
      categoriaId,
      parseInt(giorno),
      prestazioneId,
      data
    );
  }

  @Get('cliente/:id')
  async getPerCliente(@Param('id') id: string) {
    return await this.appuntamentiService.findByCliente(id);
  }

  @Get('operatore/:id')
  async getPerOperatore(@Param('id') id: string) {
    return await this.appuntamentiService.findByOperatore(id);
  }

  @Patch(':id/stato')
  async cambiaStato(
    @Param('id') id: string,
    @Body('stato') stato: 'in attesa' | 'confermato' | 'rifiutato'
  ) {
    await this.appuntamentiService.aggiornaStato(id, stato);
    return { success: true, message: 'Stato aggiornato con successo!' };
  }

  @Delete(':id')
  async eliminaAppuntamento(@Param('id') id: string) {
    await this.appuntamentiService.elimina(id);
    return { success: true, message: 'Appuntamento eliminato con successo!' };
  }
}