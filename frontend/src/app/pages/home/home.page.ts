import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline, alertCircleOutline, checkmarkCircleOutline, closeCircleOutline, trashOutline, personOutline, medicalOutline, flaskOutline, calendarOutline, timeOutline, closeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
import { AppuntamentoDetailComponent } from '../../components/appuntamento-detail/appuntamento-detail.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, AppuntamentoDetailComponent],
})
export class HomePage implements OnInit, OnDestroy {
  user: User | null = null;
  listaAppuntamenti: any[] = [];

  // Appuntamenti ordinati dal più prossimo al più lontano
  get appuntamentiOrdinati(): any[] {
    return [...this.listaAppuntamenti].sort((a, b) => {
      const dateA = `${a.data}T${a.ora}`;
      const dateB = `${b.data}T${b.ora}`;
      return dateA.localeCompare(dateB);
    });
  }

  get daConfermare(): any[] {
    return this.appuntamentiOrdinati.filter(a => a.stato === 'in attesa');
  }

  get confermati(): any[] {
    return this.appuntamentiOrdinati.filter(a => a.stato === 'confermato');
  }

  get completati(): any[] {
    return this.appuntamentiOrdinati.filter(a => a.stato === 'completato');
  }

  private authSubscription!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private appuntamentiApiService: AppuntamentiApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({ logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline, alertCircleOutline, checkmarkCircleOutline, closeCircleOutline, trashOutline, personOutline, medicalOutline, flaskOutline, calendarOutline, timeOutline, closeOutline });
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (userData) => {
        this.user = userData;

        if (this.user && this.user.id) {
          console.log(`Utente loggato: ${this.user.nome} (${this.user.ruolo})`);
          this.caricaAppuntamentiOperatore();
        }
      },
      error: (err) => {
        console.error('Errore nella ricezione dei dati utente:', err);
      }
    });
  }

  ionViewWillEnter() {
    if (this.user && this.user.id) {
      this.caricaAppuntamentiOperatore();
    }
  }

  caricaAppuntamentiOperatore() {
    if (!this.user || !this.user.id) return;

    // Se l'utente è un operatore
    if (this.user.ruolo === 'operatore') {
      this.appuntamentiApiService.getAppuntamentiPerOperatore(this.user.id).subscribe({
        next: (res) => {
          this.listaAppuntamenti = res;
          console.debug('📅 Appuntamenti ricevuti per l\'operatore:', this.listaAppuntamenti);
        },
        error: (err) => console.error('Errore nel recupero appuntamenti operatore:', err)
      });
    } else {
      // Se l'utente è un cliente
      this.appuntamentiApiService.getAppuntamentiPerCliente(this.user.id).subscribe({
        next: (res) => {
          this.listaAppuntamenti = res;
          console.debug('📅 Appuntamenti ricevuti per il cliente:', this.listaAppuntamenti);
        },
        error: (err) => console.error('Errore nel recupero appuntamenti cliente:', err)
      });
    }
  }

  // Restituisce true se la data dell'appuntamento corrisponde a quella odierna
  isOggi(data: string): boolean {
    const oggi = new Date().toISOString().split('T')[0];
    return String(data).split('T')[0] === oggi;
  }

  async apriDettaglio(appuntamento: any) {
    const modal = await this.modalCtrl.create({
      component: AppuntamentoDetailComponent,
      componentProps: {
        appuntamento,
        ruoloUtente: this.user?.ruolo
      },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    if (data.azione === 'conferma' || data.azione === 'rifiuta') {
      const nuovoStato = data.azione === 'conferma' ? 'confermato' : 'rifiutato';
      this.appuntamentiApiService.patchStatoAppuntamento(data.id, nuovoStato).subscribe({
        next: async (res) => {
          if (res.success) {
            this.caricaAppuntamentiOperatore();
            const toast = await this.toastCtrl.create({
              message: nuovoStato === 'confermato' ? 'Appuntamento confermato.' : 'Appuntamento rifiutato.',
              duration: 2500,
              color: nuovoStato === 'confermato' ? 'success' : 'warning',
              position: 'bottom'
            });
            toast.present();
          }
        },
        error: () => this.mostraToast('Errore durante l\'aggiornamento.', 'danger')
      });
    }

    if (data.azione === 'elimina') {
      this.appuntamentiApiService.eliminaAppuntamento(data.id).subscribe({
        next: async (res) => {
          if (res.success) {
            this.caricaAppuntamentiOperatore();
            this.mostraToast('Appuntamento eliminato.', 'success');
          }
        },
        error: () => this.mostraToast('Errore durante l\'eliminazione.', 'danger')
      });
    }
  }

  private async mostraToast(messaggio: string, colore: string) {
    const toast = await this.toastCtrl.create({
      message: messaggio,
      duration: 2500,
      color: colore,
      position: 'bottom'
    });
    toast.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    // Disiscrivo l'observable quando la pagina viene distrutta
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  visualizzaReferto(url: string) {
    window.open(`assets/mock-pdf/${url}`, '_blank');
  }

  scaricaReferto(url: string) {
    const link = document.createElement('a');
    link.href = `assets/mock-pdf/${url}`;
    link.download = url;
    link.click();
  }

  navigaA(path: string) {
    this.router.navigate([path]);
  }
}