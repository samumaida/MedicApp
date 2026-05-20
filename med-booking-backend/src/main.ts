import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
