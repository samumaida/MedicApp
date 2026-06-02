import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prestazione } from '../../prestazioni/entities/prestazione.entity';

@Entity('appuntamenti')
export class Appuntamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  data!: string;

  @Column({ type: 'varchar', length: 5 })
  ora!: string;

  @Column({
    type: 'enum',
    enum: ['in attesa', 'confermato', 'rifiutato', 'completato'],
    default: 'in attesa'
  })
  stato!: 'in attesa' | 'confermato' | 'rifiutato' | 'completato';

  @Column({ type: 'text', nullable: true })
  note?: string;

  // Percorso del referto caricato dall'operatore dopo la visita
  @Column({ type: 'varchar', length: 255, nullable: true })
  refertoUrl?: string;

  // Relazione con il cliente
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  cliente!: User;

  // Relazione con l'Operatore
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  operatore!: User;

  // Relazione con la Prestazione specifica del catalogo
  @ManyToOne(() => Prestazione, { onDelete: 'RESTRICT' })
  prestazione!: Prestazione;

  @CreateDateColumn()
  createdAt!: Date;
}