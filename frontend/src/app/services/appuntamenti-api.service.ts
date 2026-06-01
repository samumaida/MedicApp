import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppuntamentoConRelazioni,
  OperatoreDisponibile,
  RispostaSuccesso,
  RispostaCreaAppuntamento
} from '../models/reservations.model';

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

  getOperatoriDisponibili(categoriaId: string, giorno: number, prestazioneId: string, data: string): Observable<OperatoreDisponibile[]> {
    const params = {
      categoriaId,
      giorno: giorno.toString(),
      prestazioneId,
      data
    };
    return this.http.get<OperatoreDisponibile[]>(`${this.apiUrl}/operatori-disponibili`, { params });
  }

  inviaPrenotazione(payload: InviaAppuntamentoDto): Observable<RispostaCreaAppuntamento> {
    return this.http.post<RispostaCreaAppuntamento>(`${this.apiUrl}/prenota`, payload);
  }

  getAppuntamentiPerCliente(clienteId: string): Observable<AppuntamentoConRelazioni[]> {
    return this.http.get<AppuntamentoConRelazioni[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getAppuntamentiPerOperatore(operatoreId: string): Observable<AppuntamentoConRelazioni[]> {
    return this.http.get<AppuntamentoConRelazioni[]>(`${this.apiUrl}/operatore/${operatoreId}`);
  }

  patchStatoAppuntamento(id: string, stato: 'confermato' | 'rifiutato'): Observable<RispostaSuccesso> {
    return this.http.patch<RispostaSuccesso>(`${this.apiUrl}/${id}/stato`, { stato });
  }

  eliminaAppuntamento(id: string): Observable<RispostaSuccesso> {
    return this.http.delete<RispostaSuccesso>(`${this.apiUrl}/${id}`);
  }
}
