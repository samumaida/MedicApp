import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

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
  ],
})
export class AppModule {}