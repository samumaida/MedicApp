import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PrestazioniService } from './prestazioni.service';
import { PrestazioniController } from './prestazioni.controller';
import { Prestazione } from './entities/prestazione.entity';
import { User } from '../users/entities/user.entity';
import { OperatorePrestazione } from './entities/operatore-prestazione.entity';
import { Categoria } from './entities/categoria.entity';
import { CategorieSeeder } from './categorie.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prestazione, User, OperatorePrestazione, Categoria]),
    JwtModule.register({
      secret: 'CHIAVE_SEGRETA_SUPER_DIFFICILE_PER_LA_TESI_2026',
    }),
  ],
  controllers: [PrestazioniController],
  providers: [PrestazioniService, CategorieSeeder],
  exports: [PrestazioniService, TypeOrmModule],
})
export class PrestazioniModule {}