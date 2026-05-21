import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Prestazione } from '../../prestazioni/entities/prestazione.entity';

// Definisco i ruoli possibili con un Enum
export enum UserRole {
  PAZIENTE = 'paziente',
  MEDICO = 'medico',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Column({ type: 'varchar', length: 100 })
  cognome!: string;

  @Column({ unique: true }) 
  email!: string;

  @Column()
  password_hash!: string; 

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PAZIENTE,
  })
  ruolo!: UserRole;

  @ManyToMany(() => Prestazione, (prestazione) => prestazione.medici, { cascade: true })
  @JoinTable({
    name: 'medico_prestazioni', // Tabella di giunzione nel DB
    joinColumn: { name: 'medico_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'prestazione_id', referencedColumnName: 'id' }
  })
  prestazioni!: Prestazione[];
}