import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Appuntamento } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  currentUser: any = null;

  private userSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user_session') || 'null'));

  user$ = this.userSubject.asObservable();

  private appuntamenti: Appuntamento[] = [];

  private datiInizialiDiTest: Appuntamento[] = [
    { id: 1, pazienteNome: 'Mario Rossi', data: '2026-05-20', ora: '09:00', stato: 'confermato', prestazione: 'Visita Cardiologica' },
    { id: 2, pazienteNome: 'Anna Bianchi', data: '2026-05-20', ora: '10:30', stato: 'in attesa', prestazione: 'Controllo Routine' },
    { id: 3, pazienteNome: 'Luca Verdone', data: '2026-05-18', ora: '15:00', stato: 'completato', prestazione: 'Elettrocardiogramma', refertoUrl: 'referto_3.pdf' }
  ];

  // Lista delle prestazioni disponibili nell'ambulatorio
  private prestazioni = [
    { id: 'cardio', nome: 'Visita Cardiologica' },
    { id: 'derma', nome: 'Visita Dermatologica' },
    { id: 'ocu', nome: 'Visita Oculistica' }
  ];

  // Lista dei medici con relativi orari/giorni di disponibilità
  private medici = [
    { id: 101, nome: 'Dott. M. Rossi', specializzazione: 'cardio', giorniDisponibili: [1, 3, 5], orari: ['09:00', '10:00', '11:00'] }, // Lun, Mer, Ven
    { id: 102, nome: 'Dott.ssa A. Bianchi', specializzazione: 'cardio', giorniDisponibili: [2, 4], orari: ['14:30', '15:30', '16:30'] }, // Mar, Gio
    { id: 103, nome: 'Dott. G. Verdi', specializzazione: 'derma', giorniDisponibili: [1, 2, 3, 4, 5], orari: ['10:00', '11:30'] }
  ];

  constructor() { 
    // Sincronizzo la variabile locale se c'era già un utente salvato
    this.currentUser = this.userSubject.value;

    const appuntamentiSalvati = localStorage.getItem('lista_appuntamenti');

    if (appuntamentiSalvati) {
      // Se trovo qualcosa nel browser, carico quella lista (che contiene i nuovi appuntamenti)
      this.appuntamenti = JSON.parse(appuntamentiSalvati);
      console.log('Appuntamenti recuperati dallo storage:', this.appuntamenti);
    } else {
      // Se lo storage è vuoto uso i dati di test
      this.appuntamenti = this.datiInizialiDiTest;
      localStorage.setItem('lista_appuntamenti', JSON.stringify(this.appuntamenti));
      console.log('Storage vuoto, caricati dati di test iniziali.');
    }

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

    // Aggiorno il BehaviorSubject con il nuovo utente
    this.userSubject.next(this.currentUser);

    console.debug('Login effettuato e sessione salvata:', this.currentUser);
  }

  getCurrentUser() { 
    return this.currentUser; 
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user_session');
    this.userSubject.next(null);
    console.debug('Sessione eliminata.');
  }

  getAppuntamenti() { 
    return this.appuntamenti; 
  }

  getPrestazioni() { return this.prestazioni; }
  getMedici() { return this.medici; }

  addAppuntamento(nuovo: Appuntamento) {
    this.appuntamenti.push(nuovo);
    //Salvo l'appuntamento anche nel localStorage per persistenza
    localStorage.setItem('lista_appuntamenti', JSON.stringify(this.appuntamenti));
  }

  removeAppuntamento(id: number) {
  // Filtro l'array tenendo tutti gli appuntamenti tranne quello con l'ID selezionato
  this.appuntamenti = this.appuntamenti.filter(app => app.id !== id);
  // Aggiorno il localStorage per mantenere la modifica al refresh
  localStorage.setItem('lista_appuntamenti', JSON.stringify(this.appuntamenti));
  console.log(`Appuntamento ${id} eliminato.`);
}
}