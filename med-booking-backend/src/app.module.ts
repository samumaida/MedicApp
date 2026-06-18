import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrestazioniModule } from './prestazioni/prestazioni.module';
import { AppuntamentiModule } from './appuntamenti/appuntamenti.module';

// Legge le variabili DB da process.env dopo che ConfigModule ha caricato .env
const dbHost = process.env['DB_HOST'] || 'localhost';
const dbPort = Number(process.env['DB_PORT']) || 5432;
const dbUser = process.env['DB_USER'] || 'postgres';
const dbPass = process.env['DB_PASSWORD'] || 'password_segreta';
const dbName = process.env['DB_NAME'] || 'medicapp_db';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: dbName,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    PrestazioniModule,
    AppuntamentiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
