import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Il nome è obbligatorio' })
  nome!: string;

  @IsString()
  @IsNotEmpty({ message: 'Il cognome è obbligatorio' })
  cognome!: string;

  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La password deve contenere almeno 6 caratteri' })
  password!: string;

  // Solo i ruoli 'cliente' e 'operatore' sono accettati dalla registrazione pubblica.
  // Il ruolo 'admin' è escluso intenzionalmente in quanto l'admin è creato solo manualmente sul database.
  @IsIn([UserRole.CLIENTE, UserRole.OPERATORE], { message: 'Il ruolo selezionato non è valido' })
  ruolo!: UserRole;

  // Campi opzionali, li lascio pronti per quando registrerò i dati specifici del cliente
  @IsOptional()
  @IsString()
  codiceFiscale?: string;

  @IsOptional()
  @IsString()
  dataNascita?: string;

  @IsOptional()
  @IsString()
  sesso?: string;
}
