import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InviaAppuntamentoDto {
  data: string;
  ora: string;
  clienteId: string;
  operatoreId: string;
  prestazioneId: string | number;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppuntamentiApiService {
  private apiUrl = 'http://localhost:3000/appuntamenti'; 

  constructor(private http: HttpClient) {}

  getOperatoriDisponibili(categoriaId: string, giorno: number, prestazioneId: string, data: string): Observable<any[]> {
    const params = {
      categoriaId,
      giorno: giorno.toString(),
      prestazioneId,
      data
    };

    return this.http.get<any[]>(`${this.apiUrl}/operatori-disponibili`, { params });
  }

  // Invia la nuova prenotazione al database Postgres
  inviaPrenotazione(payload: InviaAppuntamentoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/prenota`, payload);
  }

  // Recupera gli appuntamenti del cliente
  getAppuntamentiPerCliente(clienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Recupera gli appuntamenti dell'operatore
  getAppuntamentiPerOperatore(operatoreId: string): Observable<any[]> {
    const a = this.http.get<any[]>(`${this.apiUrl}/operatore/${operatoreId}`)
    console.log('Chiamata API per operatoreId:', operatoreId, 'URL:', `${this.apiUrl}/operatore/${operatoreId}`);
    return a;
  }

  patchStatoAppuntamento(id: string, stato: 'confermato' | 'rifiutato'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/stato`, { stato });
  }

  eliminaAppuntamento(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}