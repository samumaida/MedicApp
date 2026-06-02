import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestazione, CategoriaMinima, RispostaSuccesso } from '../models/reservations.model';
import { User, TurnoDisponibile } from '../models/user.model';

// Riga inviata al backend per abilitare una prestazione con i valori personalizzati dell'operatore
export interface PrestazioneOperatoreDto {
  prestazioneId: string;
  durataMinuti: number;
  prezzo: number;
}

// Risposta del backend dopo il salvataggio delle prestazioni dell'operatore
export interface RispostaSalvaPrestazioni extends RispostaSuccesso {
  user: User;
}

// Dati del profilo operatore restituiti dal backend
export interface ProfiloOperatoreDto {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  specializzazione?: string;
  giorniDisponibili: TurnoDisponibile[];
}

@Injectable({
  providedIn: 'root'
})
export class PrestazioniApiService {
  private apiUrl = 'http://localhost:3000/prestazioni';

  constructor(private http: HttpClient) {}

  getPrestazioniDalDb(): Observable<Prestazione[]> {
    return this.http.get<Prestazione[]>(this.apiUrl);
  }

  getCategorie(): Observable<CategoriaMinima[]> {
    return this.http.get<CategoriaMinima[]>(`${this.apiUrl}/categorie`);
  }

  // Metodi admin — Categorie
  creaCategoriaAdmin(dati: CategoriaMinima): Observable<CategoriaMinima> {
    return this.http.post<CategoriaMinima>(`${this.apiUrl}/categorie`, dati);
  }

  aggiornaCategoriaAdmin(id: string, dati: Partial<CategoriaMinima>): Observable<CategoriaMinima> {
    return this.http.patch<CategoriaMinima>(`${this.apiUrl}/categorie/${id}`, dati);
  }

  eliminaCategoriaAdmin(id: string): Observable<RispostaSuccesso> {
    return this.http.delete<RispostaSuccesso>(`${this.apiUrl}/categorie/${id}`);
  }

  // Metodi admin — Prestazioni
  creaPrestazioneAdmin(dati: Omit<Prestazione, 'id'>): Observable<Prestazione> {
    return this.http.post<Prestazione>(this.apiUrl, dati);
  }

  aggiornaPrestazioneAdmin(id: string, dati: Partial<Prestazione>): Observable<Prestazione> {
    return this.http.patch<Prestazione>(`${this.apiUrl}/${id}`, dati);
  }

  eliminaPrestazioneAdmin(id: string): Observable<RispostaSuccesso> {
    return this.http.delete<RispostaSuccesso>(`${this.apiUrl}/${id}`);
  }

  // Metodi operatore
  salvaPrestazioniOperatore(operatoreId: string, payload: { prestazioni: PrestazioneOperatoreDto[] }): Observable<RispostaSalvaPrestazioni> {
    return this.http.post<RispostaSalvaPrestazioni>(`${this.apiUrl}/aggiorna-operatore/${operatoreId}`, payload);
  }

}
