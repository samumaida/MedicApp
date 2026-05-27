import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OperatorePrestazione } from '../../prestazioni/entities/operatore-prestazione.entity';

export enum UserRole {
  CLIENTE = 'cliente',
  OPERATORE = 'operatore',
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
    default: UserRole.CLIENTE,
  })
  ruolo!: UserRole;
  
  @Column({ type: 'jsonb', nullable: true })
  giorniDisponibili?: { giorno: number; inizio: string; fine: string }[];

  @Column({ type: 'varchar', length: 150, nullable: true })
  specializzazione?: string;

  @OneToMany(() => OperatorePrestazione, (op) => op.operatore, { cascade: true })
  operatorePrestazioni!: OperatorePrestazione[];
}