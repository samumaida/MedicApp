import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  // Uso l'Enum nativo per validare i ruoli, così evito errori di battitura e garantisco che solo i ruoli validi vengano accettati
  @IsEnum(UserRole, { message: 'Il ruolo selezionato non è valido' })
  ruolo!: UserRole;   

  // Campi opzionali, li lascio pronti per quando registrerò i dati specifici del paziente
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