import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; 

  // Creo un canale reattivo che contiene i dati dell'utente
  private currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user_data') || 'null'));
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user_data', JSON.stringify(response.user));

          // Aggiorno il BehaviorSubject con i dati dell'utente appena loggato
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');

    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Restituisce il valore statico
  getUserData() {
    return this.currentUserSubject.value;
  }

  aggiornaStatoUtente(nuovoUtente: any) {
    localStorage.setItem('user_data', JSON.stringify(nuovoUtente));
    this.currentUserSubject.next(nuovoUtente);
  }
}