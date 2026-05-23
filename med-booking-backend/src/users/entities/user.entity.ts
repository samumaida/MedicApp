import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OperatorePrestazione } from '../../prestazioni/entities/operatore-prestazione.entity';

// Definisco i ruoli possibili con un Enum
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

  @OneToMany(() => OperatorePrestazione, (op) => op.operatore, { cascade: true })
  operatorePrestazioni!: OperatorePrestazione[];
}