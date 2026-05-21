import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestazioniService } from './prestazioni.service';
import { PrestazioniController } from './prestazioni.controller';
import { Prestazione } from './entities/prestazione.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prestazione, User])],
  controllers: [PrestazioniController],
  providers: [PrestazioniService],
  exports: [PrestazioniService, TypeOrmModule],
})
export class PrestazioniModule {}