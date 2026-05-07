export interface User {
  id: number;
  nome: string;
  cognome: string;
  sesso: 'M' | 'F';
  CF: string;
  dataNascita: Date;
  NumeroTelefono: string;
  indirizzo: string;
  email: string;
  ruolo: 'medico' | 'paziente';
}