import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PrestazioniModule } from './prestazioni/prestazioni.module';
import { AppuntamentiModule } from './appuntamenti/appuntamenti.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password_segreta',
      database: 'medicapp_db',
      autoLoadEntities: true, // Carica automaticamente le entità dei moduli
      synchronize: true,     // Crea/aggiorna le tabelle a ogni avvio
    }),
    AuthModule,
    PrestazioniModule,
    AppuntamentiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}