import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrestazioniService {
  private apiUrl = 'http://localhost:3000/prestazioni';

  constructor(private http: HttpClient) { }

  // Recupero tutte le prestazioni disponibili nel sistema
  getCatalogoPrestazioni(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Invio al backend le prestazioni scelte dall'operatore comprensive di prezzo e durata personalizzati
  salvaPrestazioniOperatore(operatoreId: string, prestazioniPersonalizzate: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/aggiorna-operatore/${operatoreId}`, { 
      prestazioni: prestazioniPersonalizzate 
    });
  }
}