import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('categorie')
export class Categoria {
  // ID testuale (es. 'cardiologia') che corrisponde al campo categoriaId in prestazioni
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  // Percorso relativo all'immagine servita dal frontend
  @Column({ type: 'varchar', length: 255, nullable: true })
  immagine!: string;
}
