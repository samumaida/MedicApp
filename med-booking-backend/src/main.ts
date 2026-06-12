import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Rende i file nella cartella 'uploads' scaricabili via URL
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  // Aumento il limite del payload per supportare le immagini base64 delle categorie
  app.use(require('express').json({ limit: '2mb' }));
  app.use(require('express').urlencoded({ limit: '2mb', extended: true }));

  // CORS configurato tramite variabile d'ambiente CORS_ORIGIN (vedi .env).
  //
  // Sviluppo:   CORS_ORIGIN=localhost  → accetta qualsiasi porta localhost
  //             (ionic serve può usare 8100, 8101, ecc. a seconda della porta libera)
  // Produzione: CORS_ORIGIN=https://app.medicapp.codesea.it → solo l'URL reale
  //
  // Nota sicurezza: consentire localhost non espone l'API a rischi esterni —
  // il CORS è una protezione del browser e nessun sito remoto può avere
  // origine "localhost". In produzione però lo blocchiamo comunque per pulizia.
  const corsOriginEnv = process.env['CORS_ORIGIN'] || 'localhost';

  app.enableCors({
    origin: (origin, callback) => {
      // Permetti richieste senza origin (Postman, app Capacitor installata)
      if (!origin) return callback(null, true);

      const isAllowed =
        corsOriginEnv === 'localhost'
          // Sviluppo: qualsiasi porta localhost + schemi Capacitor (Android usa https://localhost)
          ? origin.startsWith('http://localhost') || origin.startsWith('https://localhost') || origin.startsWith('capacitor://localhost')
          // Produzione: solo l'URL esatto definito in .env
          : origin === corsOriginEnv;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non consentita dal CORS: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Rimuove automaticamente proprietà extra non definite nel DTO
    forbidNonWhitelisted: true, // Blocca la richiesta se ci sono proprietà non permesse
    transform: true, // Trasforma i tipi primitivi nei tipi definiti nel DTO
  }));

  // Configurazione Swagger per la documentazione API
  const configSwagger = new DocumentBuilder()
    .setTitle('MedicApp API')
    .setDescription('Documentazione delle API REST di MedicApp — sistema di prenotazione visite mediche')
    .setVersion('1.0')
    .addBearerAuth()  // Aggiunge il campo per il token JWT nell'interfaccia Swagger
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env['PORT'] ?? 3000);
}
bootstrap();
