import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Rende i file nella cartella 'uploads' scaricabili via URL (es. http://localhost:3000/uploads/referti/referto.pdf)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  // Aumento il limite del payload per supportare le immagini base64 delle categorie
  app.use(require('express').json({ limit: '2mb' }));
  app.use(require('express').urlencoded({ limit: '2mb', extended: true }));

  app.enableCors({
    origin: 'http://localhost:8100', // L'indirizzo standard dove gira Ionic in locale
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
