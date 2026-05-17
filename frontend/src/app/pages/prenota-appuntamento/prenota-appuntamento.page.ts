import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';
import { addIcons } from 'ionicons';
import { medicalOutline, chevronForwardOutline, arrowBackOutline } from 'ionicons/icons';
import { User, Appuntamento } from '../../models/user.model';

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
  mediciFiltrati: any[] = [];
  
  // Scelte dell'utente
  prestazioneScelta: any = null;
  dataSelezionata: string = '';
  dataMinima: string = new Date().toISOString().split('T')[0]; // Impedisce date passate

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

  selezionaPrestazione(prestazione: any) {
    this.prestazioneScelta = prestazione;
    this.step = 2; // Avanza alla data
  }

  selezionaData(event: any) {
    this.dataSelezionata = event.detail.value.split('T')[0];
    
    // Calcolo il giorno della settimana (0 = Domenica, 1 = Lunedì, etc...)
    const dataObj = new Date(this.dataSelezionata);
    let giornoSettimana = dataObj.getDay(); 
    if (giornoSettimana === 0) giornoSettimana = 7; // Adatto domenica = 7

    // Trovo i medici che fanno quella visita E lavorano in quel giorno
    const tuttiIMedici = this.mockService.getMedici();
    this.mediciFiltrati = tuttiIMedici.filter(medico => 
      medico.specializzazione === this.prestazioneScelta.id &&
      medico.giorniDisponibili.includes(giornoSettimana)
    );

    this.step = 3; // Procedo con la scelta di medico e orario
  }

  indietro(targetStep: number) {
    this.step = targetStep;
  }

  async confermaPrenotazione(medico: any, ora: string) {
    const utenteCorrente = this.mockService.getCurrentUser();

    const nuovoApp: Appuntamento = {
      id: Math.floor(Math.random() * 1000), // Creo un ID provvisorio dal timestamp
      pazienteNome: utenteCorrente?.nome + ' ' + utenteCorrente?.cognome,
      data: this.dataSelezionata,
      ora: ora,
      stato: 'confermato',
      prestazione: this.prestazioneScelta.nome
    };

    this.mockService.addAppuntamento(nuovoApp);

    const toast = await this.toastCtrl.create({
      message: `Appuntamento fissato con il ${medico.nome}!`,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();

    this.router.navigate(['/home']);
  }
}