import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TurnoDisponibile } from '../models/user.model';
import { RispostaSuccesso } from '../models/reservations.model';
import { ProfiloOperatoreDto } from './prestazioni-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProfiloApiService {
  private apiUrl = 'http://localhost:3000/prestazioni';

  constructor(private http: HttpClient) {}

  // Salva specializzazione e orari di ricevimento dell'operatore
  salvaImpostazioniProfilo(id: string, specializzazione: string, orariLavoro: TurnoDisponibile[]): Observable<RispostaSuccesso> {
    return this.http.patch<RispostaSuccesso>(`${this.apiUrl}/operatore/${id}/impostazioni-profilo`, {
      specializzazione,
      orariLavoro
    });
  }

  // Recupera specializzazione e orari di ricevimento dell'operatore
  getProfiloOperatore(id: string): Observable<ProfiloOperatoreDto> {
    return this.http.get<ProfiloOperatoreDto>(`${this.apiUrl}/operatore/${id}/profilo`);
  }
}
