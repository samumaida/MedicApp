import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';
import { addIcons } from 'ionicons';
import { medicalOutline, chevronForwardOutline, arrowBackOutline } from 'ionicons/icons';
import { Prestazione } from '../../models/reservations.model';
import { FormsModule } from '@angular/forms';
import { PrestazioniApiService } from '../../services/prestazioni-api.service';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
import { AuthService } from '../../services/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-prenota-appuntamento',
  templateUrl: './prenota-appuntamento.page.html',
  styleUrls: ['./prenota-appuntamento.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PrenotaAppuntamentoPage implements OnInit {
  step: number = 1;
  
  listaPrestazioni: Prestazione[] = [];
  operatoriFiltrati: any[] = [];
  
  prestazioneScelta: Prestazione | null = null;
  dataSelezionata: string = '';
  dataMinima: string = new Date().toISOString().split('T')[0]; // Impedisce date passate

  categoriaSelezionataId: string = '';
  testoCercato: string = '';
  categorieFiltrate: any[] = [];

  categoriePrestazioni: any[] = [
    { id: 'pediatria', nome: 'Pediatria e Ginecologia', immagine: 'assets/images/categories/pediatria.png', prestazioni: [] },
    { id: 'cardiologia', nome: 'Cardiologia', immagine: 'assets/images/categories/cardiologia.png', prestazioni: [] },
    { id: 'diagnostica', nome: 'Diagnostica per Immagini', immagine: 'assets/images/categories/radiologia.png', prestazioni: [] },
    { id: 'laboratorio', nome: 'Analisi di Laboratorio', immagine: 'assets/images/categories/laboratorio.png', prestazioni: [] },
    { id: 'ortopedia', nome: 'Ortopedia e Fisiatria', immagine: 'assets/images/categories/ortopedia.png', prestazioni: [] }
  ];

  constructor(
    private mockService: MockDataService, 
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private prestazioniApiService: PrestazioniApiService,
    private appuntamentiApiService: AppuntamentiApiService,
  ) {
    addIcons({ medicalOutline, chevronForwardOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.caricaPrestazioniDalDb();
    this.categorieFiltrate = [...this.categoriePrestazioni];
  }

  caricaPrestazioniDalDb() {
    this.prestazioniApiService.getPrestazioniDalDb().subscribe({
      next: (esamiDaDb: Prestazione[]) => {
        this.listaPrestazioni = esamiDaDb;

        // Pulisco i vecchi dati finti dalle categorie grafiche
        this.categoriePrestazioni.forEach(cat => cat.prestazioni = []);

        // Carico gli esami nelle categorie
        esamiDaDb.forEach(esame => {
          const categoria = this.categoriePrestazioni.find(cat => cat.id === esame.categoriaId);
          if (categoria) {
            categoria.prestazioni.push(esame);
          }
        });

        // Aggiorno la vista
        this.categorieFiltrate = [...this.categoriePrestazioni];
      },
      error: (err) => {
        console.error('Errore durante il recupero dei dati dal backend:', err);
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

      const esamiFiltrati = cat.prestazioni.filter((p: any) => 
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

    // Applico il filtro corretto
    this.appuntamentiApiService.getOperatoriDisponibili(
      this.categoriaSelezionataId,
      giornoSettimana,
      String(this.prestazioneScelta.id)
    ).subscribe({
      next: (operatori: any[]) => {
        // Postgres restituisce già solo i medici compatibili, attivi e con prezzi/durate corretti
        this.operatoriFiltrati = operatori;
        
        console.debug('Operatori trovati sul DB per questo giorno:', this.operatoriFiltrati);
        
        this.step = 3;
      },
      error: (err: any) => {
        console.error('Errore durante il recupero dei medici dal DB:', err);
      }
    });
  }

  indietro(targetStep: number) {
    this.step = targetStep;
  }

  async confermaPrenotazione(operatore: any, ora: string) {
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

    this.appuntamentiApiService.inviaPrenotazione(payload).subscribe({
      next: async (res) => {
        if (res.success) {
          const toast = await this.toastCtrl.create({
            message: `Appuntamento richiesto con successo. In attesa di approvazione del medico.`,
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
  }
}