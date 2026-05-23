import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { PrestazioniService } from '../../services/prestazioni';
import { addIcons } from 'ionicons';
import { pencilOutline } from 'ionicons/icons';

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
  
  prestazioniSelezionate: { [key: string]: { attiva: boolean; durataMinuti: number; prezzo: number } } = {};
  
  testoCercato: string = '';
  isModalOpen = false;
  prestazioneInModifica: any = null;

  private authSub!: Subscription;

  constructor(
    private authService: AuthService,
    private prestazioniService: PrestazioniService,
    private toastController: ToastController
  ) { 
    addIcons({ pencilOutline });
   }

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
  this.prestazioniSelezionate = {};
  
  // Inizializzo tutte le prestazioni del catalogo come "disattivate" e con i valori di base
  this.catalogoPrestazioni.forEach(p => {
    this.prestazioniSelezionate[p.id] = {
      attiva: false,
      durataMinuti: p.durataMinuti,
      prezzo: p.prezzo
    };
  });

  // Se l'operatore ha già personalizzazioni nel DB, sovrascrivo l'inizializzazione
  if (this.operatoreLoggato && this.operatoreLoggato.operatorePrestazioni) {
    this.operatoreLoggato.operatorePrestazioni.forEach((op: any) => {
      
      // Verifico che l'oggetto della prestazione relazionata esista per evitare crash indotti da dati sporchi
      if (op.prestazione && op.prestazione.id) {
        this.prestazioniSelezionate[op.prestazione.id] = {
          attiva: true,
          durataMinuti: op.durataMinuti,
          prezzo: op.prezzo
        };
      }
      
    });
  }
}

  apriModalModifica(prestazione: any) {
    const datiAttuali = this.prestazioniSelezionate[prestazione.id];

    // Creiamo un oggetto temporaneo per il modal in modo da non cambiare
    // i dati visualizzati nella lista finché l'utente non conferma le modifiche
    this.prestazioneInModifica = {
      id: prestazione.id,
      nome: prestazione.nome,
      durataMinuti: datiAttuali.durataMinuti,
      prezzo: datiAttuali.prezzo
    };

    this.isModalOpen = true;
  }

  confermaModificaModal() {
    if (this.prestazioneInModifica) {
      const id = this.prestazioneInModifica.id;

      // Salvo i valori personalizzati nella mappa
      this.prestazioniSelezionate[id].durataMinuti = this.prestazioneInModifica.durataMinuti;
      this.prestazioniSelezionate[id].prezzo = this.prestazioneInModifica.prezzo;
    }

    this.isModalOpen = false;
    this.prestazioneInModifica = null;
  }

  annullaModal() {
    this.isModalOpen = false;
    this.prestazioneInModifica = null; 
  }

  salvaScelte() {
    // Filtro solo le prestazioni attive e mappo i dati completi da mandare al server
    const datiDaSalvare = Object.keys(this.prestazioniSelezionate)
      .filter(id => this.prestazioniSelezionate[id].attiva === true)
      .map(id => ({
        prestazioneId: id,
        durataMinuti: this.prestazioniSelezionate[id].durataMinuti,
        prezzo: this.prestazioniSelezionate[id].prezzo
      }));

    // Passo l'array di oggetti al servizio
    this.prestazioniService.salvaPrestazioniOperatore(this.operatoreLoggato.id, datiDaSalvare).subscribe({
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