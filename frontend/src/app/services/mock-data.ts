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
    // CARDIOLOGIA (cardio)
    { 
      id: 101, 
      nome: 'Dott. M. Rossi', 
      specializzazione: 'cardiologia', 
      giorniDisponibili: [1, 3, 5], // Lun, Mer, Ven
      orari: ['09:00', '10:00', '11:00', '12:00'] 
    },
    { 
      id: 102, 
      nome: 'Dott.ssa A. Bianchi', 
      specializzazione: 'cardiologia', 
      giorniDisponibili: [2, 4], // Mar, Gio
      orari: ['14:30', '15:30', '16:30', '17:30'] 
    },

    // PEDIATRIA E GINECOLOGIA (pediatria)
    { 
      id: 104, 
      nome: 'Dott.ssa E. Viola', 
      specializzazione: 'pediatria', 
      giorniDisponibili: [1, 2, 4], // Lun, Mar, Gio
      orari: ['08:30', '09:30', '10:30', '11:30'] 
    },
    { 
      id: 105, 
      nome: 'Dott. F. Neri', 
      specializzazione: 'pediatria', 
      giorniDisponibili: [3, 5], // Mer, Ven
      orari: ['15:00', '16:00', '17:00', '18:00'] 
    },

    // DIAGNOSTICA PER IMMAGINI / RADIOLOGIA (diagnostica)
    { 
      id: 106, 
      nome: 'Dott.ssa L. Gialli', 
      specializzazione: 'diagnostica', 
      giorniDisponibili: [1, 2, 3, 4, 5], // Lun-Ven (Servizio continuo)
      orari: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] 
    },

    // ANALISI DI LABORATORIO (laboratorio)
    { 
      id: 107, 
      nome: 'Centro Prelievi (Dott. S. Bruno)', 
      specializzazione: 'laboratorio', 
      giorniDisponibili: [1, 2, 3, 4, 5, 6], // Lun-Sab (Incluso sabato mattina per i prelievi)
      orari: ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00'] 
    },

    // ORTOPEDIA E FISIATRIA (ortopedia)
    { 
      id: 108, 
      nome: 'Dott. R. Marroni', 
      specializzazione: 'ortopedia', 
      giorniDisponibili: [2, 5], // Mar, Ven
      orari: ['09:00', '10:30', '14:00', '15:30'] 
    },
    { 
      id: 109, 
      nome: 'Dott.ssa C. Grigio (Fisioterapista)', 
      specializzazione: 'ortopedia', 
      giorniDisponibili: [1, 3, 4], // Lun, Mer, Gio
      orari: ['11:00', '12:00', '16:00', '17:00', '18:00'] 
    }
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

    private salvaSuStorage() {
      localStorage.setItem('lista_appuntamenti', JSON.stringify(this.appuntamenti));
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