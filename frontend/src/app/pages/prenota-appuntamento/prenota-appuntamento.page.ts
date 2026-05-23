import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';
import { addIcons } from 'ionicons';
import { medicalOutline, chevronForwardOutline, arrowBackOutline } from 'ionicons/icons';
import { User, Appuntamento } from '../../models/user.model';
import { Prestazione } from '../../models/reservations.model';

@Component({
  selector: 'app-prenota-appuntamento',
  templateUrl: './prenota-appuntamento.page.html',
  styleUrls: ['./prenota-appuntamento.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class PrenotaAppuntamentoPage implements OnInit {
  step: number = 1;
  
  listaPrestazioni: any[] = [];
  operatoriFiltrati: any[] = [];
  
  prestazioneScelta: Prestazione | null = null;
  dataSelezionata: string = '';
  dataMinima: string = new Date().toISOString().split('T')[0]; // Impedisce date passate

  categoriaSelezionataId: string = '';

  constructor(
    private mockService: MockDataService, 
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ medicalOutline, chevronForwardOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.listaPrestazioni = this.mockService.getPrestazioni();
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

    // 1. Recuperiamo tutti gli operatori dal service
    const tuttiGliOperatori = this.mockService.getOperatori();

    // 2. Troviamo la categoria di appartenenza della prestazione.
    // Se l'oggetto 'prestazioneScelta' ha già al suo interno l'id della categoria (es. prestazioneScelta.categoriaId), usa quello!
    // Altrimenti, se ha una proprietà stringa, usiamo quella. Ipotizziamo si chiami 'categoriaId':
    const categoriaDaFiltrare = this.categoriaSelezionataId;

    // 3. Applichiamo il filtro corretto
    this.operatoriFiltrati = tuttiGliOperatori.filter(operatore => 
      operatore.specializzazione === categoriaDaFiltrare &&
      operatore.giorniDisponibili.includes(giornoSettimana)
    );

    console.log('Operatori trovati per questo giorno:', this.operatoriFiltrati);

    this.step = 3;
  }

  indietro(targetStep: number) {
    this.step = targetStep;
  }

  async confermaPrenotazione(operatore: any, ora: string) {
    const utenteCorrente = this.mockService.getCurrentUser();

    const nuovoApp: Appuntamento = {
      id: Math.floor(Math.random() * 1000), // Creo un ID provvisorio dal timestamp
      clienteNome: utenteCorrente?.nome + ' ' + utenteCorrente?.cognome,
      data: this.dataSelezionata,
      ora: ora,
      stato: 'in attesa',
      prestazione: this.prestazioneScelta?.nome ?? ''
    };

    this.mockService.addAppuntamento(nuovoApp);

    const toast = await this.toastCtrl.create({
      message: `Appuntamento richiesto con il ${operatore.nome}. Riceverai una mail di conferma appena sarà approvato dal medico.`,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();

    this.router.navigate(['/home']);
  }

  categoriePrestazioni = [
    {
      id: 'pediatria',
      nome: 'Pediatria e Ginecologia',
      immagine: 'assets/images/categories/pediatria.png', // Sostituisci con i tuoi percorsi reali
      prestazioni: [
        { id: 1, nome: 'Test DNA Fetale', descrizione: 'Screening prenatale non invasivo del DNA libero.' },
        { id: 2, nome: 'Visita Pediatrica di Controllo', descrizione: 'Bilancio di salute e monitoraggio della crescita.' },
        { id: 3, nome: 'Ecografia Morfologica', descrizione: 'Controllo ecografico ostetrico dettagliato.' }
      ]
    },
    {
      id: 'cardiologia',
      nome: 'Cardiologia',
      immagine: 'assets/images/categories/cardiologia.png',
      prestazioni: [
        { id: 4, nome: 'Visita Cardiologica con ECG', descrizione: 'Valutazione specialistica con elettrocardiogramma.' },
        { id: 5, nome: 'Ecocardiogramma color doppler', description: 'Ecografia mirata allo studio delle strutture cardiache.' },
        { id: 6, nome: 'Holter Cardiaco 24h', descrizione: 'Monitoraggio continuo del ritmo cardiaco.' }
      ]
    },
    {
      id: 'diagnostica',
      nome: 'Diagnostica per Immagini',
      immagine: 'assets/images/categories/radiologia.png',
      prestazioni: [
        { id: 7, nome: 'Radiografia Toracica (RX)', descrizione: 'Esame radiologico standard del torace.' },
        { id: 8, nome: 'Ronanza Magnetica Nucleare', descrizione: 'Studio ad alta risoluzione dei tessuti molli e articolazioni.' },
        { id: 9, nome: 'Ecografia Addome Completo', descrizione: 'Screening ecografico degli organi addominali.' }
      ]
    },
    {
      id: 'laboratorio',
      nome: 'Analisi di Laboratorio',
      immagine: 'assets/images/categories/laboratorio.png',
      prestazioni: [
        { id: 10, nome: 'Esami del Sangue Routine', descrizione: 'Emocromo completo, profilo lipidico e glicemico.' },
        { id: 11, nome: 'Tampone Faringeo Microbiologico', descrizione: 'Ricerca colturale di batteri patogeni respiratori.' }
      ]
    },
    {
      id: 'ortopedia',
      nome: 'Ortopedia e Fisiatria',
      immagine: 'assets/images/categories/ortopedia.png',
      prestazioni: [
        { id: 12, nome: 'Visita Ortopedica', descrizione: 'Consulto specialistico per patologie osteo-articolari.' },
        { id: 13, nome: 'Seduta di Fisioterapia', descrizione: 'Trattamento di riabilitazione motoria personalizzato.' }
      ]
    }
  ];
}