import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { medicalOutline, chevronForwardOutline, arrowBackOutline } from 'ionicons/icons';
import { Prestazione, Categoria, OperatoreDisponibile } from '../../models/reservations.model';
import { FormsModule } from '@angular/forms';
import { PrestazioniApiService } from '../../services/prestazioni-api.service';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
import { AuthService } from '../../services/auth';
import { firstValueFrom } from 'rxjs';
import { 
  IonAccordion, 
  IonAccordionGroup, 
  IonAvatar, 
  IonBackButton, 
  IonButton, 
  IonButtons, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonCol, 
  IonContent, 
  IonDatetime, 
  IonGrid, 
  IonHeader, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonRow, 
  IonSearchbar, 
  IonTitle, 
  IonToolbar 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-prenota-appuntamento',
  templateUrl: './prenota-appuntamento.page.html',
  styleUrls: ['./prenota-appuntamento.page.scss'],
  standalone: true,
  imports: [
    IonAccordion, 
    IonAccordionGroup, 
    IonAvatar, 
    IonBackButton, 
    IonButton, 
    IonButtons, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardSubtitle, 
    IonCardTitle, 
    IonCol, 
    IonContent, 
    IonDatetime, 
    IonGrid, 
    IonHeader, 
    IonIcon, 
    IonItem, 
    IonLabel, 
    IonRow, 
    IonSearchbar, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule
  ]
})
export class PrenotaAppuntamentoPage implements OnInit {
  step: number = 1;
  
  listaPrestazioni: Prestazione[] = [];
  operatoriFiltrati: OperatoreDisponibile[] = [];
  
  prestazioneScelta: Prestazione | null = null;
  dataSelezionata: string = '';
  dataMinima: string = new Date().toISOString().split('T')[0]; // Impedisce date passate

  categoriaSelezionataId: string = '';
  testoCercato: string = '';
  categorieFiltrate: Categoria[] = [];
  categoriePrestazioni: Categoria[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private prestazioniApiService: PrestazioniApiService,
    private appuntamentiApiService: AppuntamentiApiService,
  ) {
    addIcons({ medicalOutline, chevronForwardOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.caricaCategorieEPrestazioni();
  }

  caricaCategorieEPrestazioni() {
    // Prima carico le categorie dal DB, poi le prestazioni da distribuire in esse
    this.prestazioniApiService.getCategorie().subscribe({
      next: (categorie) => {
        // Inizializzo ogni categoria con un array vuoto di prestazioni
        this.categoriePrestazioni = categorie.map(cat => ({ ...cat, prestazioni: [] as Prestazione[] }));
        this.caricaPrestazioniDalDb();
      },
      error: (err) => {
        console.error('Errore durante il recupero delle categorie:', err);
      }
    });
  }

  caricaPrestazioniDalDb() {
    this.prestazioniApiService.getPrestazioniDalDb().subscribe({
      next: (esamiDaDb: Prestazione[]) => {
        this.listaPrestazioni = esamiDaDb;

        // Distribuisco le prestazioni nelle rispettive categorie
        esamiDaDb.forEach(esame => {
          const categoria = this.categoriePrestazioni.find(cat => cat.id === esame.categoriaId);
          if (categoria) {
            categoria.prestazioni.push(esame);
          }
        });

        // Aggiorno la vista mostrando solo le categorie che hanno almeno una prestazione
        this.categorieFiltrate = this.categoriePrestazioni.filter(cat => cat.prestazioni.length > 0);
      },
      error: (err) => {
        console.error('Errore durante il recupero delle prestazioni:', err);
      }
    });
  }

  filtraEsami(event: any) {
  const query = (event.target.value || '').toLowerCase().trim();
  this.testoCercato = query;

  if (!query) {
    // Se la barra è vuota, mostro tutto l'array originale
    this.categorieFiltrate = [...this.categoriePrestazioni];
    return;
  }

  // Eseguo il filtro di ricerca
  this.categorieFiltrate = this.categoriePrestazioni
    .map(cat => {
      if (cat.nome.toLowerCase().includes(query)) {
        return cat;
      }

      const esamiFiltrati = cat.prestazioni.filter((p: Prestazione) =>
        p.nome.toLowerCase().includes(query) || 
        (p.descrizione && p.descrizione.toLowerCase().includes(query))
      );

      return { ...cat, prestazioni: esamiFiltrati };
    })
    .filter(cat => cat.prestazioni.length > 0);
}

  selezionaPrestazione(prestazione: Prestazione, categoriaId: string): void {
    this.prestazioneScelta = prestazione;
    this.categoriaSelezionataId = categoriaId; // Salviamo es. 'pediatria' o 'cardiologia'
    this.step = 2;
  }

  selezionaData(event: any) {
    this.dataSelezionata = event.detail.value.split('T')[0];
    
    // Calcolo il giorno della settimana (0 = Domenica, 1 = Lunedì, etc...)
    const dataObj = new Date(this.dataSelezionata);
    let giornoSettimana = dataObj.getDay(); 
    if (giornoSettimana === 0) giornoSettimana = 7; // Adatto domenica = 7

    if (!this.prestazioneScelta || !this.categoriaSelezionataId) {
      console.error('Mancano i dati della prestazione o della categoria.');
      return;
    }

    // Applico il filtro corretto, passando anche la data per escludere gli slot già occupati
    this.appuntamentiApiService.getOperatoriDisponibili(
      giornoSettimana,
      String(this.prestazioneScelta.id),
      this.dataSelezionata
    ).subscribe({
      next: (operatori: OperatoreDisponibile[]) => {
        // Postgres restituisce già solo gli operatori compatibili, attivi e con prezzi/durate corretti
        this.operatoriFiltrati = operatori;
        
        this.step = 3;
      },
      error: (err: any) => {
        console.error('Errore durante il recupero degli operatori dal DB:', err);
      }
    });
  }

  indietro(targetStep: number) {
    this.step = targetStep;
  }

  async confermaPrenotazione(operatore: OperatoreDisponibile, ora: string) {
    // Recupero l'utente loggato
    const utenteCorrente = await firstValueFrom(this.authService.currentUser$);
    
    if (!utenteCorrente || !utenteCorrente.id) {
      const toast = await this.toastCtrl.create({
        message: 'Devi essere autenticato per poter prenotare un appuntamento.',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    if (!this.prestazioneScelta) {
      console.error('Nessuna prestazione selezionata.');
      return;
    }

    // Preparo il payload sull'interfaccia DTO del backend
    const payload = {
      data: this.dataSelezionata,
      ora: ora,
      clienteId: utenteCorrente.id,
      operatoreId: operatore.id,
      prestazioneId: this.prestazioneScelta.id,
      note: ''
    };

    try {
      this.appuntamentiApiService.inviaPrenotazione(payload).subscribe({
        next: async (res) => {
          if (res.success) {
            const toast = await this.toastCtrl.create({
              message: `Appuntamento richiesto con successo. In attesa di approvazione dal medico.`,
              duration: 3500,
              color: 'success',
              position: 'bottom'
            });
            await toast.present();

            this.router.navigate(['/home']);
          }
        },
        error: async (err) => {
          console.error('Errore durante la prenotazione:', err);
          const toast = await this.toastCtrl.create({
            message: 'Impossibile completare la prenotazione. Riprova più tardi.',
            duration: 3000,
            color: 'danger',
            position: 'bottom'
          });
          await toast.present();
        }
      });
    } finally {
      this.step = 1;
      this.prestazioneScelta = null;
      this.dataSelezionata = '';
      this.categoriaSelezionataId = '';
      this.operatoriFiltrati = [];
    }
  }
}