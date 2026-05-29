import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestazione } from '../models/reservations.model';

@Injectable({
  providedIn: 'root'
})
export class PrestazioniApiService {
  private apiUrl = 'http://localhost:3000/prestazioni'; 

  constructor(private http: HttpClient) {}

  getPrestazioniDalDb(): Observable<Prestazione[]> {
    return this.http.get<Prestazione[]>(this.apiUrl);
  }

  getCategorie(): Observable<{ id: string; nome: string; immagine: string }[]> {
    return this.http.get<{ id: string; nome: string; immagine: string }[]>(`${this.apiUrl}/categorie`);
  }

  creaCategoriaAdmin(dati: { id: string; nome: string; immagine?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categorie`, dati);
  }

  aggiornaCategoriaAdmin(id: string, dati: { id?: string; nome?: string; immagine?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/categorie/${id}`, dati);
  }

  eliminaCategoriaAdmin(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categorie/${id}`);
  }

  creaPrestazioneAdmin(dati: { nome: string; descrizione?: string; categoriaId: string; durataMinuti: number; prezzo: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl, dati);
  }

  aggiornaPrestazioneAdmin(id: string, dati: Partial<{ nome: string; descrizione: string; categoriaId: string; durataMinuti: number; prezzo: number }>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, dati);
  }

  eliminaPrestazioneAdmin(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  salvaPrestazioniOperatore(operatoreId: string, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/aggiorna-operatore/${operatoreId}`, payload);
  }

  salvaImpostazioniProfilo(id: string, specializzazione: string, orariLavoro: any[]): Observable<any> {
    const body = {
      specializzazione,
      orariLavoro
    };
    
    return this.http.patch<any>(`${this.apiUrl}/operatore/${id}/impostazioni-profilo`, body);
  }

  getProfiloMedico(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/operatore/${id}/profilo`);
  }
}