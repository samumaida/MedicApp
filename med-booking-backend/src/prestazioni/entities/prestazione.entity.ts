import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('prestazioni')
export class Prestazione {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descrizione!: string;

  @Column({ type: 'int', default: 30 })
  durataMinuti!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  prezzo!: number;

  // Rendiamo generica la relazione ManyToMany che punta agli operatori
  @ManyToMany(() => User, (user) => user.prestazioni)
  operatori!: User[];
}