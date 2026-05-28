import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';

@Injectable()
export class CategorieSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  // Eseguito automaticamente da NestJS dopo l'avvio del modulo
  async onApplicationBootstrap() {
    const totale = await this.categoriaRepository.count();

    // Inserisco le categorie di default solo se la tabella è vuota
    if (totale === 0) {
      const categorieDefault: Categoria[] = [
        { id: 'pediatria',   nome: 'Pediatria e Ginecologia',    immagine: 'assets/images/categories/pediatria.png' },
        { id: 'cardiologia', nome: 'Cardiologia',                immagine: 'assets/images/categories/cardiologia.png' },
        { id: 'diagnostica', nome: 'Diagnostica per Immagini',   immagine: 'assets/images/categories/radiologia.png' },
        { id: 'laboratorio', nome: 'Analisi di Laboratorio',     immagine: 'assets/images/categories/laboratorio.png' },
        { id: 'ortopedia',   nome: 'Ortopedia e Fisiatria',      immagine: 'assets/images/categories/ortopedia.png' },
      ];

      await this.categoriaRepository.save(categorieDefault);
      console.log('Categorie di default inserite nel database.');
    }
  }
}
