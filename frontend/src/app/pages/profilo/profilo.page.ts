import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { PrestazioniApiService } from '../../services/prestazioni-api.service';
import { AuthService } from '../../services/auth';
import { PaginaConModifiche } from '../../guards/unsaved-changes.guard';
import { Subscription } from 'rxjs';
import { User, TurnoDisponibile } from '../../models/user.model';

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.page.html',
  styleUrls: ['./profilo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfiloPage implements OnInit, OnDestroy, PaginaConModifiche {

  utente: User | null = null;
  modificheNonSalvate = false;
  private authSubscription!: Subscription;

  giorniSettimana = [
    { id: 1, nome: 'Lunedì', selezionato: false, inizio: '09:00', fine: '18:00' },
    { id: 2, nome: 'Martedì', selezionato: false, inizio: '09:00', fine: '18:00' },
    { id: 3, nome: 'Mercoledì', selezionato: false, inizio: '09:00', fine: '18:00' },
    { id: 4, nome: 'Giovedì', selezionato: false, inizio: '09:00', fine: '18:00' },
    { id: 5, nome: 'Venerdì', selezionato: false, inizio: '09:00', fine: '18:00' },
    { id: 6, nome: 'Sabato', selezionato: false, inizio: '09:00', fine: '13:00' },
    { id: 7, nome: 'Domenica', selezionato: false, inizio: '09:00', fine: '18:00' },
  ];

  constructor(
    private prestazioniApiService: PrestazioniApiService,
    private authService: AuthService, // <--- Iniettiamo l'AuthService reale
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (userData) => {
        this.utente = userData;
        
        if (this.utente && this.utente.id) {
          console.log(`Profilo caricato per l'utente reale: ${this.utente.nome}`);
          if (this.utente.ruolo === 'operatore') {
            this.caricaDatiProfiloDalDB(this.utente.id);
          }
        }
      },
      error: (err) => {
        console.error('Errore nel recupero dell\'utente corrente:', err);
      }
    });
  }

  /**
   * Chiamata HTTP per recupperare i dati dell'operatore
   */
  caricaDatiProfiloDalDB(idUtente: string) {
    this.prestazioniApiService.getProfiloOperatore(idUtente).subscribe({
      next: (datiDB) => {
        if (this.utente) {
          this.utente.specializzazione = datiDB.specializzazione;
          this.utente.giorniDisponibili = datiDB.giorniDisponibili || [];
          this.mappaOrariDalDB();
        }
      },
      error: (err) => {
        console.error('Impossibile caricare i turni dal server:', err);
      }
    });
  }

  /**
   * Prendo l'array di oggetti JSON dal DB e accendo i relativi toggle nel frontend
   */
  mappaOrariDalDB() {
    if (this.utente && this.utente.giorniDisponibili && Array.isArray(this.utente.giorniDisponibili)) {
      this.giorniSettimana.forEach(g => g.selezionato = false);

      this.utente.giorniDisponibili.forEach((turno: TurnoDisponibile) => {
        const giornoTrovato = this.giorniSettimana.find(g => g.id === turno.giorno);
        if (giornoTrovato) {
          giornoTrovato.selezionato = true;
          giornoTrovato.inizio = turno.inizio;
          giornoTrovato.fine = turno.fine;
        }
      });
    }
  }

  haModificheNonSalvate(): boolean {
    return this.modificheNonSalvate;
  }

  onModifica() {
    this.modificheNonSalvate = true;
  }

  /**
   * Salvo le modifiche degli orari su Postgres
   */
  salvaImpostazioniOperatore() {
    if (!this.utente || !this.utente.id) return;

    const turniFinali = this.giorniSettimana
      .filter(g => g.selezionato)
      .map(g => ({
        giorno: g.id,
        inizio: g.inizio,
        fine: g.fine
      }));

    this.prestazioniApiService.salvaImpostazioniProfilo(
      this.utente.id, 
      this.utente.specializzazione || '', 
      turniFinali
    ).subscribe({
      next: async (risposta) => {
        this.modificheNonSalvate = false;
        const toast = await this.toastController.create({
          message: 'Profilo e orari salvati con successo!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();
      },
      error: (err) => {
        console.error('Errore durante la PATCH:', err);
        alert('Errore durante il salvataggio.');
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}