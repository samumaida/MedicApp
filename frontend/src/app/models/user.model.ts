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

export interface Appuntamento {
  id: number;
  pazienteNome: string;
  data: string;
  ora: string;
  stato: 'confermato' | 'in_attesa' | 'completato';
  prestazione: string;
  refertoUrl?: string;
}