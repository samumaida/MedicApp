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
    { id: 1, clienteNome: 'Mario Rossi', data: '2026-05-20', ora: '09:00', stato: 'confermato', prestazione: 'Visita Cardiologica' },
    { id: 2, clienteNome: 'Anna Bianchi', data: '2026-05-20', ora: '10:30', stato: 'in attesa', prestazione: 'Controllo Routine' },
    { id: 3, clienteNome: 'Luca Verdone', data: '2026-05-18', ora: '15:00', stato: 'completato', prestazione: 'Elettrocardiogramma', refertoUrl: 'referto_3.pdf' }
  ];

  // Lista degli operatori con relativi orari/giorni di disponibilità
  private operatori = [];

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

    private salvaSuStorage() {
      localStorage.setItem('lista_appuntamenti', JSON.stringify(this.appuntamenti));
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

  getOperatori() { return this.operatori; }

  addAppuntamento(nuovo: Appuntamento) {
    this.appuntamenti.push(nuovo);
    this.salvaSuStorage();
    console.log('Nuovo appuntamento salvato.');
  }

  removeAppuntamento(id: number) {
    this.appuntamenti = this.appuntamenti.filter(app => app.id !== id);
    this.salvaSuStorage();
    console.log(`Appuntamento ${id} eliminato.`);
  }

  updateStatoAppuntamento(id: number, nuovoStato: 'confermato' | 'rifiutato' | 'in attesa' | 'completato') {
    const appuntamento = this.appuntamenti.find(app => app.id === id);
    if (appuntamento) {
      appuntamento.stato = nuovoStato;
      
      this.salvaSuStorage(); 
      console.log(`Stato appuntamento ${id} aggiornato a "${nuovoStato}" con successo.`);
    } else {
      console.error(`Impossibile trovare l'appuntamento con ID ${id}`);
    }
  }
}