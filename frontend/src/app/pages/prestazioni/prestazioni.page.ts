import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { Subscription, take } from 'rxjs';
import { AuthService } from '../../services/auth';
import { User, OperatorePrestazione } from '../../models/user.model';
import { Prestazione, Categoria, CategoriaMinima, PrestazioneInModifica, PrestazioneAdminForm } from '../../models/reservations.model';
import { PrestazioniApiService } from '../../services/prestazioni-api.service';
import { PaginaConModifiche } from '../../guards/unsaved-changes.guard';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, addOutline, folderOutline, chevronForwardOutline, saveOutline } from 'ionicons/icons';
import { 
  IonBackButton, 
  IonButton, 
  IonButtons, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonContent, 
  IonFooter, 
  IonHeader, 
  IonIcon, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonModal, 
  IonSearchbar, 
  IonSpinner, 
  IonTitle, 
  IonToggle, 
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-prestazioni',
  templateUrl: './prestazioni.page.html',
  styleUrls: ['./prestazioni.page.scss'],
  standalone: true,
  imports: [
    IonBackButton, 
    IonButton, 
    IonButtons, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardSubtitle, 
    IonCardTitle, 
    IonContent, 
    IonFooter, 
    IonHeader, 
    IonIcon, 
    IonInput, 
    IonItem, 
    IonLabel, 
    IonList, 
    IonModal, 
    IonSearchbar, 
    IonSpinner, 
    IonTitle, 
    IonToggle, 
    IonToolbar, 
    CommonModule, 
    FormsModule
  ]
})
export class PrestazioniPage implements OnInit, OnDestroy, PaginaConModifiche {
  operatoreLoggato: User | null = null;
  catalogoPrestazioni: Prestazione[] = [];

  prestazioniSelezionate: { [key: string]: { attiva: boolean; durataMinuti: number; prezzo: number } } = {};

  testoCercato: string = '';
  isModalOpen = false;
  prestazioneInModifica: PrestazioneInModifica | null = null;

  modificheNonSalvate = false;

  private authSub!: Subscription;

  // Modal prestazione admin
  modalAdmin: PrestazioneAdminForm | null = null;
  isModalAdminOpen = false;
  isNuovaPrestazione = false;

  categorieDisponibili: { id: string; nome: string; immagine?: string }[] = [];

  // Picker per selezione categoria in creazione/modifica prestazione
  isCategoriaPickerOpen = false;
  categoriePickerFiltrate: CategoriaMinima[] = [];
  testoCercatoCategoria = '';

  // Modal per gestione categorie
  isGestioneCategorieOpen = false;
  nuovaCategoria = { id: '', nome: '', immagine: '' };
  immaginePreview: string = '';
  isModificaCategoria = false;
  idCategoriaInModifica = '';

  constructor(
    private authService: AuthService,
    private prestazioniApiService: PrestazioniApiService,
    private toastController: ToastController,
    private alertController: AlertController,
    private ngZone: NgZone
  ) {
    addIcons({ pencilOutline, trashOutline, addOutline, folderOutline, chevronForwardOutline, saveOutline });
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
    // Scarico le categorie per popolare la lista "categoria" in creazione/modifica prestazione
    this.prestazioniApiService.getCategorie().subscribe({
      next: (cats) => this.categorieDisponibili = cats,
      error: () => {}
    });

    // Scarico tutte le prestazioni dal backend
    this.prestazioniApiService.getPrestazioniDalDb().subscribe({
      next: (res) => {
        this.catalogoPrestazioni = res;
        this.mappaPrestazioniAttive();
      },
      error: (err) => this.mostraToast('Errore nel caricamento delle prestazioni', 'danger')
    });
  }

  get prestazioniFiltrate(): Prestazione[] {
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
      durataMinuti: p.durataMinuti ?? 30,
      prezzo: p.prezzo ?? 0
    };
  });

  // Se l'operatore ha già personalizzazioni nel DB, sovrascrivo l'inizializzazione
  if (this.operatoreLoggato && this.operatoreLoggato.operatorePrestazioni) {
    this.operatoreLoggato.operatorePrestazioni.forEach((op: OperatorePrestazione) => {
      
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

  apriModalModifica(prestazione: Prestazione) {
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

  // Metodo usato dal guard di navigazione per verificare se ci sono modifiche non salvate
  haModificheNonSalvate(): boolean {
    return this.modificheNonSalvate;
  }

  // Chiamato dal template quando l'utente attiva/disattiva un toggle
  onToggleModifica() {
    this.modificheNonSalvate = true;
  }

  confermaModificaModal() {
    if (this.prestazioneInModifica) {
      const id = this.prestazioneInModifica.id;

      // Salvo i valori personalizzati nella mappa
      this.prestazioniSelezionate[id].durataMinuti = this.prestazioneInModifica.durataMinuti;
      this.prestazioniSelezionate[id].prezzo = this.prestazioneInModifica.prezzo;

      this.modificheNonSalvate = true;
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
    this.prestazioniApiService.salvaPrestazioniOperatore(this.operatoreLoggato!.id, { prestazioni: datiDaSalvare }).subscribe({
      next: (res) => {
        if (res.success) {
          this.modificheNonSalvate = false;
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

  /**
   * Metodi riservati all'admin
   */

  apriModalNuovaPrestazione() {
    this.modalAdmin = { nome: '', descrizione: '', categoriaId: '', durataMinuti: 30, prezzo: 0 };
    this.isNuovaPrestazione = true;
    this.isModalAdminOpen = true;
  }

  apriModalModificaAdmin(prestazione: Prestazione) {
    this.modalAdmin = {
      id: prestazione.id,
      nome: prestazione.nome,
      descrizione: prestazione.descrizione,
      categoriaId: prestazione.categoriaId ?? '',
      durataMinuti: prestazione.durataMinuti ?? 30,
      prezzo: prestazione.prezzo ?? 0
    };
    this.isNuovaPrestazione = false;
    this.isModalAdminOpen = true;
  }

  chiudiModalAdmin() {
    this.isModalAdminOpen = false;
    this.modalAdmin = null;
  }

  salvaModalAdmin() {
    if (!this.modalAdmin) return;

    if (!this.modalAdmin.nome?.trim()) {
      this.mostraToast('Il nome della prestazione è obbligatorio.', 'warning');
      return;
    }

    if (!this.modalAdmin.categoriaId) {
      this.mostraToast('Seleziona una categoria prima di salvare.', 'warning');
      return;
    }

    // Costruisco un oggetto pulito con solo i campi che il backend accetta
    const datiDaInviare = {
      nome: this.modalAdmin.nome,
      descrizione: this.modalAdmin.descrizione,
      categoriaId: this.modalAdmin.categoriaId,
      durataMinuti: this.modalAdmin.durataMinuti,
      prezzo: this.modalAdmin.prezzo
    };

    const operazione$ = this.isNuovaPrestazione
      ? this.prestazioniApiService.creaPrestazioneAdmin(datiDaInviare)
      : this.prestazioniApiService.aggiornaPrestazioneAdmin(this.modalAdmin.id!, datiDaInviare);

    operazione$.subscribe({
      next: () => {
        this.mostraToast(this.isNuovaPrestazione ? 'Prestazione aggiunta.' : 'Prestazione aggiornata.', 'success');
        this.chiudiModalAdmin();
        this.caricaDati();
      },
      error: () => this.mostraToast('Errore durante il salvataggio.', 'danger')
    });
  }

  eliminaPrestazioneAdmin(id: string) {
    this.prestazioniApiService.eliminaPrestazioneAdmin(id).subscribe({
      next: () => {
        this.mostraToast('Prestazione eliminata.', 'success');
        this.caricaDati();
      },
      error: () => this.mostraToast('Errore durante l\'eliminazione.', 'danger')
    });
  }

  /**
   * Picker categoria searchable
   */

  apriCategoriaPicker() {
    this.categoriePickerFiltrate = [...this.categorieDisponibili];
    this.testoCercatoCategoria = '';
    this.isCategoriaPickerOpen = true;
  }

  filtraCategoriePicker(event: any) {
    const q = (event.target.value || '').toLowerCase().trim();
    this.categoriePickerFiltrate = this.categorieDisponibili.filter(c =>
      c.nome.toLowerCase().includes(q)
    );
  }

  selezionaCategoriaDaPicker(cat: { id: string; nome: string }) {
    if (this.modalAdmin) {
      this.modalAdmin.categoriaId = cat.id;
      this.modalAdmin.categoriaNome = cat.nome;
    }
    this.isCategoriaPickerOpen = false;
  }

  /**
   * Gestione categorie
   */

  apriGestioneCategorie() {
    this.nuovaCategoria = { id: '', nome: '', immagine: '' };
    this.immaginePreview = '';
    this.isModificaCategoria = false;
    this.idCategoriaInModifica = '';
    this.categoriePickerFiltrate = [...this.categorieDisponibili];
    this.isGestioneCategorieOpen = true;
  }

  chiudiGestioneCategorie() {
    this.isGestioneCategorieOpen = false;
  }

  aggiornaCategorieEChiudi() {
    this.prestazioniApiService.getCategorie().subscribe({
      next: (cats) => {
        this.categorieDisponibili = cats;
        this.chiudiGestioneCategorie();
      }
    });
  }

  // Verifico la dimensione dell'immagine e la converto in base64
  onImmagineSelezionata(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const maxSizeKB = 1500;
    if (file.size > maxSizeKB * 1024) {
      this.mostraToast(`Immagine troppo grande. Massimo consentito: ${maxSizeKB} KB.`, 'warning');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.nuovaCategoria.immagine = base64;
      this.immaginePreview = base64;
    };
    reader.readAsDataURL(file);
  }

  avviaModificaCategoria(cat: CategoriaMinima) {
    this.nuovaCategoria = { id: cat.id, nome: cat.nome, immagine: cat.immagine || '' };
    this.immaginePreview = cat.immagine || '';
    this.isModificaCategoria = true;
    this.idCategoriaInModifica = cat.id;

    // Aspetta la fine del ciclo di change detection per assicurarmi che il DOM sia aggiornato
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      const modalContent = document.querySelector('ion-modal ion-content');
      if (modalContent) {
        (modalContent as HTMLElement & { scrollToTop: (duration: number) => void }).scrollToTop(300);
      }
    });
  }

  annullaModificaCategoria() {
    this.nuovaCategoria = { id: '', nome: '', immagine: '' };
    this.immaginePreview = '';
    this.isModificaCategoria = false;
    this.idCategoriaInModifica = '';
  }

  private ricaricaCategorie() {
    this.prestazioniApiService.getCategorie().subscribe(cats => {
      this.categorieDisponibili = cats;
      this.categoriePickerFiltrate = [...cats];
    });
  }

  aggiungicategoria() {
    this.nuovaCategoria.id = this.nuovaCategoria.id.trim().toLowerCase().replace(/\s+/g, '_');
    this.nuovaCategoria.nome = this.nuovaCategoria.nome.trim();

    if (!this.nuovaCategoria.id || !this.nuovaCategoria.nome) {
      this.mostraToast('ID e Nome sono obbligatori.', 'warning');
      return;
    }

    const operazione$ = this.isModificaCategoria
      ? this.prestazioniApiService.aggiornaCategoriaAdmin(this.idCategoriaInModifica, this.nuovaCategoria)
      : this.prestazioniApiService.creaCategoriaAdmin(this.nuovaCategoria);

    operazione$.subscribe({
      next: () => {
        this.mostraToast(this.isModificaCategoria ? 'Categoria aggiornata.' : 'Categoria aggiunta.', 'success');
        this.annullaModificaCategoria();
        this.ricaricaCategorie();
        this.caricaDati();
      },
      error: () => this.mostraToast('Errore durante il salvataggio.', 'danger')
    });
  }

  async eliminaCategoria(id: string) {
    const categoria = this.categorieDisponibili.find(c => c.id === id);
    const prestazioniCollegate = this.catalogoPrestazioni.filter(p => p.categoriaId === id);
    const nPrestazioni = prestazioniCollegate.length;

    // Prima conferma eliminazione categoria
    const alert1 = await this.alertController.create({
      header: 'Elimina Categoria',
      message: `Sei sicuro di voler eliminare "${categoria?.nome}"? ${nPrestazioni > 0 ? `Ci sono ${nPrestazioni} prestazioni collegate che verranno dissociate.` : 'Nessuna prestazione è collegata a questa categoria.'}`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Continua',
          role: 'destructive',
          handler: async () => {
            // Seconda conferma eliminazione categoria con istruzioni operative
            const nomiPrestazioni = prestazioniCollegate.map(p => p.nome).join(', ');
            const alert2 = await this.alertController.create({
              header: 'Conferma definitiva',
              message: nPrestazioni > 0
                ? `Dopo l\'eliminazione le seguenti prestazioni rimarranno senza categoria e non saranno prenotabili dai clienti: ${nomiPrestazioni}. Dovrai riaprire ciascuna di esse dalla sezione "Gestione Catalogo" e assegnare una nuova categoria. Vuoi procedere?`
                : 'Stai per eliminare definitivamente questa categoria. L\'operazione non è reversibile. Vuoi procedere?',
              buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                  text: 'Elimina definitivamente',
                  role: 'destructive',
                  handler: () => {
                    this.prestazioniApiService.eliminaCategoriaAdmin(id).subscribe({
                      next: () => {
                        this.mostraToast('Categoria eliminata.', 'success');
                        this.ricaricaCategorie();
                        this.caricaDati();
                      },
                      error: () => this.mostraToast('Errore durante l\'eliminazione.', 'danger')
                    });
                  }
                }
              ]
            });
            await alert2.present();
          }
        }
      ]
    });

    await alert1.present();
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }
}