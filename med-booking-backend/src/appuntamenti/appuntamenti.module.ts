import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppuntamentiController } from './appuntamenti.controller';
import { AppuntamentiService } from './appuntamenti.service';
import { Appuntamento } from './entities/appuntamento.entity';
import { OperatorePrestazione } from '../prestazioni/entities/operatore-prestazione.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appuntamento, OperatorePrestazione])], 
  controllers: [AppuntamentiController],
  providers: [AppuntamentiService],
  exports: [AppuntamentiService] 
})
export class AppuntamentiModule {}