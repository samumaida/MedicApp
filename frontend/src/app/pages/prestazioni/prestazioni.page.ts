import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { PrestazioniService } from '../../services/prestazioni';

@Component({
  selector: 'app-prestazioni',
  templateUrl: './prestazioni.page.html',
  styleUrls: ['./prestazioni.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PrestazioniPage implements OnInit, OnDestroy {
  operatoreLoggato: any = null;
  catalogoPrestazioni: any[] = [];
  
  prestazioniSelezionate: { [key: string]: boolean } = {};
  
  testoCercato: string = '';

  private authSub!: Subscription;

  constructor(
    private authService: AuthService,
    private prestazioniService: PrestazioniService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe(user => {
      this.operatoreLoggato = user;
      if (this.operatoreLoggato) {
        this.caricaDati();
      }
    });
  }

  caricaDati() {
    // Scarico tutte le prestazioni dal backend
    this.prestazioniService.getCatalogoPrestazioni().subscribe({
      next: (res) => {
        this.catalogoPrestazioni = res;
        this.mappaPrestazioniAttive();
      },
      error: (err) => this.mostraToast('Errore nel caricamento delle prestazioni', 'danger')
    });
  }

  get prestazioniFiltrate(): any[] {
    if (!this.testoCercato || this.testoCercato.trim() === '') {
      return this.catalogoPrestazioni;
    }
    
    const query = this.testoCercato.toLowerCase().trim();
    
    return this.catalogoPrestazioni.filter(p => {
      return p.nome.toLowerCase().includes(query) || 
             (p.descrizione && p.descrizione.toLowerCase().includes(query));
    });
  }

  mappaPrestazioniAttive() {
    // Svuoto la mappa precedente
    this.prestazioniSelezionate = {};
    
    // Se l'operatore ha già delle prestazioni salvate nel DB, le visualizzo nella mappa
    if (this.operatoreLoggato && this.operatoreLoggato.prestazioni) {
      this.operatoreLoggato.prestazioni.forEach((p: any) => {
        this.prestazioniSelezionate[p.id] = true;
      });
    }
  }

  salvaScelte() {
    // Trasformo la mappa di boolean in un array di soli ID selezionati (quelli a true)
    const idsDaSalvare = Object.keys(this.prestazioniSelezionate).filter(
      id => this.prestazioniSelezionate[id] === true
    );

    // Invio i dati al backend
    this.prestazioniService.salvaPrestazioniOperatore(this.operatoreLoggato.id, idsDaSalvare).subscribe({
      next: (res) => {
        if (res.success) {
          this.mostraToast(res.message, 'success');
          
          this.authService.aggiornaStatoUtente(res.user);
        }
      },
      error: (err) => this.mostraToast('Errore durante il salvataggio', 'danger')
    });
  }

  async mostraToast(messaggio: string, colore: string) {
    const toast = await this.toastController.create({
      message: messaggio,
      duration: 2000,
      color: colore,
      position: 'bottom'
    });
    await toast.present();
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }
}