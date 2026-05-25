export interface User {
  id: string;
  nome: string;
  cognome: string;
  sesso: 'M' | 'F';
  CF: string;
  dataNascita: Date;
  NumeroTelefono: string;
  indirizzo: string;
  email: string;
  ruolo: 'operatore' | 'cliente' | 'admin';
}

export interface Appuntamento {
  id: number;
  clienteNome: string;
  data: string;
  ora: string;
  stato: 'confermato' | 'in attesa' | 'rifiutato' | 'completato';
  prestazione: string;
  refertoUrl?: string;
}