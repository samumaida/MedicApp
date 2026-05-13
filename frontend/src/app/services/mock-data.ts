import { Injectable } from '@angular/core';
import { User, Appuntamento } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  // Carico l'utente dal localStorage se esiste
  private currentUser: User | null = JSON.parse(localStorage.getItem('user_session') || 'null');

  private appuntamenti: Appuntamento[] = [
    { id: 1, pazienteNome: 'Mario Rossi', data: '2026-05-20', ora: '09:00', stato: 'confermato', prestazione: 'Visita Cardiologica' },
    { id: 2, pazienteNome: 'Anna Bianchi', data: '2026-05-20', ora: '10:30', stato: 'in_attesa', prestazione: 'Controllo Routine' },
    { id: 3, pazienteNome: 'Luca Verdone', data: '2026-05-18', ora: '15:00', stato: 'completato', prestazione: 'Elettrocardiogramma', refertoUrl: 'referto_3.pdf' }
  ];

  constructor() { 
    if (this.currentUser) {
      console.log('Sessione recuperata:', this.currentUser);
    }
  }

  async loginAs(ruolo: 'medico' | 'paziente') {
    this.currentUser = {
      id: ruolo === 'medico' ? 1 : 2,
      nome: ruolo === 'medico' ? 'Dott. House' : 'Sig. Rossi',
      cognome: '',
      sesso: 'M',
      CF: 'RSSMRA80A01H501U',
      dataNascita: new Date('1980-01-01'),
      NumeroTelefono: '1234567890',
      indirizzo: 'Via Roma 1, Milano',
      ruolo: ruolo,
      email: ruolo + '@test.it'
    };

    localStorage.setItem('user_session', JSON.stringify(this.currentUser));
    console.debug('Login effettuato e sessione salvata:', this.currentUser);
  }

  getCurrentUser() { 
    return this.currentUser; 
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user_session');
    console.debug('Sessione eliminata.');
  }

  getAppuntamenti() { 
    return this.appuntamenti; 
  }
}