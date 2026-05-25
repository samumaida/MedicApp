import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OperatorePrestazione } from './operatore-prestazione.entity';

@Entity('prestazioni')
export class Prestazione {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descrizione!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoriaId!: string;

  @Column({ type: 'int', default: 30 })
  durataMinuti!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  prezzo!: number;

  @OneToMany(() => OperatorePrestazione, (op) => op.prestazione)
  operatoriImpostati!: OperatorePrestazione[];
}