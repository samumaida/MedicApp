import { Prestazione } from './reservations.model';

// Turno di lavoro dell'operatore
export interface TurnoDisponibile {
  giorno: number; // 1-7 (Lun-Dom)
  inizio: string;
  fine: string;
}

// Riga della tabella pivot operatore_prestazioni
export interface OperatorePrestazione {
  id: string;
  durataMinuti: number;
  prezzo: number;
  prestazione: Prestazione;
}

// Utente autenticato restituito dal backend
export interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'operatore' | 'cliente' | 'admin';
  specializzazione?: string;
  giorniDisponibili?: TurnoDisponibile[];
  operatorePrestazioni?: OperatorePrestazione[];
}

// Payload inviato al backend durante la registrazione
export interface RegisterData {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: 'operatore' | 'cliente';
  // Attualmente opzionali, li aggiungo in previsione di possibili migliorie. (es.: detrazione fiscale, promo per età, sesso etc...)
  codiceFiscale?: string;
  dataNascita?: string;
  sesso?: string;
}

// Risposta del backend al login
export interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  user: User;
}

// Risposta del backend alla registrazione
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: Omit<User, 'operatorePrestazioni' | 'giorniDisponibili'>;
}

