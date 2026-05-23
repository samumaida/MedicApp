import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prestazione } from './prestazione.entity';

@Entity('operatore_prestazioni')
export class OperatorePrestazione {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  durataMinuti!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prezzo!: number;

  // Relazione verso l'operatore (User)
  @ManyToOne(() => User, (user) => user.operatorePrestazioni, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operatore_id' })
  operatore!: User;

  // Relazione verso la prestazione del catalogo
  @ManyToOne(() => Prestazione, (p) => p.operatoriImpostati, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestazione_id' })
  prestazione!: Prestazione;
}