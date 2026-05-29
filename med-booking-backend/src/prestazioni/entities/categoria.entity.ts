import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('categorie')
export class Categoria {
  // ID testuale (es. 'cardiologia') che corrisponde al campo categoriaId in prestazioni
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  // Immagine categoria di tipo percorso relativo oppure stringa base64 per upload diretto dall'admin
  @Column({ type: 'text', nullable: true })
  immagine!: string;
}
