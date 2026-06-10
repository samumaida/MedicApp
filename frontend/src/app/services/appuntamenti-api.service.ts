import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppuntamentoConRelazioni,
  OperatoreDisponibile,
  RispostaSuccesso,
  RispostaCreaAppuntamento
} from '../models/reservations.model';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/appuntamenti`;

  constructor(private http: HttpClient) {}

  getOperatoriDisponibili(giorno: number, prestazioneId: string, data: string): Observable<OperatoreDisponibile[]> {
    const params = {
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

  uploadReferto(id: string, file: File): Observable<{ success: boolean; refertoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch<{ success: boolean; refertoUrl: string }>(`${this.apiUrl}/${id}/referto`, formData);
  }

  patchStatoAppuntamento(id: string, stato: 'confermato' | 'rifiutato'): Observable<RispostaSuccesso> {
    return this.http.patch<RispostaSuccesso>(`${this.apiUrl}/${id}/stato`, { stato });
  }

  eliminaAppuntamento(id: string): Observable<RispostaSuccesso> {
    return this.http.delete<RispostaSuccesso>(`${this.apiUrl}/${id}`);
  }
}
