import { Component, Input, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, checkmarkOutline, eyeOutline, downloadOutline, closeOutline, medicalOutline, timeOutline, flaskOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ModalController, ToastController } from '@ionic/angular';
import { AppuntamentoConRelazioni } from '../../models/reservations.model';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
import { environment } from '../../../environments/environment';
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-appuntamento-detail',
  standalone: true,
  imports: [
    IonBadge, 
    IonButton, 
    IonButtons, 
    IonContent, 
    IonHeader, 
    IonIcon, 
    IonItem, 
    IonLabel, 
    IonList, 
    IonTitle, 
    IonToolbar, 
    CommonModule
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dettaglio Appuntamento</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="chiudi()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Stato appuntamento -->
      <div style="text-align: center; margin-bottom: 20px;">
        <ion-badge [color]="coloreStato" style="font-size: 1rem; padding: 8px 16px;">
          {{ appuntamento.stato | uppercase }}
        </ion-badge>
      </div>

      <ion-list lines="full">

        <ion-item *ngIf="ruoloUtente === 'operatore'">
          <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <p>Paziente</p>
            <h3>{{ appuntamento.cliente?.nome }} {{ appuntamento.cliente?.cognome }}</h3>
          </ion-label>
        </ion-item>

        <ion-item *ngIf="ruoloUtente === 'cliente'">
          <ion-icon name="medical-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <p>Medico</p>
            <h3>Dott. {{ appuntamento.operatore?.nome }} {{ appuntamento.operatore?.cognome }}</h3>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="flask-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <p>Prestazione</p>
            <h3>{{ appuntamento.prestazione?.nome }}</h3>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <p>Data</p>
            <h3>{{ appuntamento.data | date:'dd/MM/yyyy' }}</h3>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="time-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <p>Orario</p>
            <h3>{{ appuntamento.ora }} - {{ calcolaOreFine(appuntamento.ora, appuntamento.prestazione?.durataMinuti) }}</h3>
          </ion-label>
        </ion-item>

        <ion-item *ngIf="appuntamento.note">
          <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
          <ion-label class="ion-text-wrap">
            <p>Note</p>
            <h3>{{ appuntamento.note }}</h3>
          </ion-label>
        </ion-item>

      </ion-list>

      <!-- Bottoni azione  -->
      <div class="ion-padding-top" style="display: flex; flex-direction: column; gap: 10px;">

        <ng-container *ngIf="ruoloUtente === 'operatore' && appuntamento?.stato === 'in attesa'">
          <ion-button expand="block" color="success" (click)="conferma()">
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            Conferma appuntamento
          </ion-button>
          <ion-button expand="block" color="warning" fill="outline" (click)="rifiuta()">
            <ion-icon name="close-circle-outline" slot="start"></ion-icon>
            Rifiuta appuntamento
          </ion-button>
        </ng-container>

        <ion-button
          *ngIf="appuntamento?.stato !== 'completato'"
          expand="block"
          color="danger"
          fill="outline"
          (click)="elimina()">
          <ion-icon name="trash-outline" slot="start"></ion-icon>
          Elimina prenotazione
        </ion-button>

        <!-- Visualizza/Scarica referto, visibile solo al cliente se il referto è disponibile -->
        <ng-container *ngIf="ruoloUtente === 'cliente' && appuntamento.refertoUrl">
          <div style="border-top: 1px solid var(--ion-color-light); padding-top: 10px;">
            <p style="font-size: 0.85rem; color: var(--ion-color-medium); margin-bottom: 6px;">Referto disponibile:</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <ion-button fill="solid" color="secondary" (click)="visualizzaReferto()">
                <ion-icon name="eye-outline" slot="start"></ion-icon>
                Visualizza
              </ion-button>
              <ion-button fill="outline" color="primary" (click)="scaricaReferto()">
                <ion-icon name="download-outline" slot="start"></ion-icon>
                Scarica
              </ion-button>
            </div>
          </div>
        </ng-container>

        <!-- Upload referto visibile solo dall'operatore sugli appuntamenti completati -->
        <ng-container *ngIf="ruoloUtente === 'operatore' && appuntamento.stato === 'completato'">
          <div style="border-top: 1px solid var(--ion-color-light); padding-top: 10px;">
            <p style="font-size: 0.85rem; color: var(--ion-color-medium); margin-bottom: 6px;">
              {{ appuntamento.refertoUrl ? 'Referto già caricato, visualizzalo o sostituiscilo:' : 'Carica il referto della visita (PDF):' }}
            </p>
            <ion-button *ngIf="appuntamento.refertoUrl" expand="block" color="secondary" fill="outline" (click)="visualizzaReferto()">
              <ion-icon name="eye-outline" slot="start"></ion-icon>
              Visualizza Referto
            </ion-button>
            <input #fileInput type="file" accept="application/pdf" style="display:none" (change)="onRefertoSelezionato($event)">
            <ion-button expand="block" color="tertiary" fill="outline" (click)="fileInput.click()">
              <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
              {{ appuntamento.refertoUrl ? 'Sostituisci Referto' : 'Carica Referto' }}
            </ion-button>
            <p *ngIf="nomeFileSelezionato" style="font-size: 0.8rem; color: var(--ion-color-medium); margin-top: 4px; text-align: center;">
              {{ nomeFileSelezionato }}
            </p>
            <ion-button *ngIf="fileSelezionato" expand="block" color="success" (click)="confermaUpload()">
              <ion-icon name="checkmark-outline" slot="start"></ion-icon>
              Conferma Upload
            </ion-button>
          </div>
        </ng-container>

        <ion-button expand="block" fill="clear" (click)="chiudi()">Chiudi</ion-button>

      </div>
    </ion-content>
  `
})
export class AppuntamentoDetailComponent {
  @Input() appuntamento!: AppuntamentoConRelazioni;
  @Input() ruoloUtente: 'operatore' | 'cliente' = 'cliente';

  fileSelezionato: File | null = null;
  nomeFileSelezionato = '';

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private appuntamentiApiService: AppuntamentiApiService
  ) {
    addIcons({ cloudUploadOutline, checkmarkOutline, eyeOutline, downloadOutline, closeOutline, medicalOutline, timeOutline, flaskOutline });
  }

  get coloreStato(): string {
    switch (this.appuntamento?.stato) {
      case 'confermato':  return 'success';
      case 'completato':  return 'primary';
      case 'rifiutato':   return 'danger';
      default:            return 'warning'; // in attesa
    }
  }

  conferma() {
    this.modalCtrl.dismiss({ azione: 'conferma', id: this.appuntamento.id });
  }

  rifiuta() {
    this.modalCtrl.dismiss({ azione: 'rifiuta', id: this.appuntamento.id });
  }

  elimina() {
    this.modalCtrl.dismiss({ azione: 'elimina', id: this.appuntamento.id });
  }

  chiudi() {
    this.modalCtrl.dismiss(null);
  }

  onRefertoSelezionato(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.mostraToast(`File troppo grande. Massimo consentito: ${maxSizeMB} MB.`, 'warning');
      return;
    }

    this.fileSelezionato = file;
    this.nomeFileSelezionato = file.name;
  }

  confermaUpload() {
    if (!this.fileSelezionato) return;

    this.appuntamentiApiService.uploadReferto(this.appuntamento.id, this.fileSelezionato).subscribe({
      next: (res) => {
        this.appuntamento.refertoUrl = res.refertoUrl;
        this.fileSelezionato = null;
        this.nomeFileSelezionato = '';
        this.mostraToast('Referto caricato con successo.', 'success');
        this.modalCtrl.dismiss({ azione: 'referto_caricato', refertoUrl: res.refertoUrl });
      },
      error: () => this.mostraToast('Errore durante il caricamento del referto.', 'danger')
    });
  }

  private readonly backendUrl = environment.apiUrl;

  // Calcola l'orario di fine appuntamento dato un orario di inizio e una durata in minuti
  calcolaOreFine(ora: string, durataMinuti: number = 60): string {
    const [h, m] = ora.split(':').map(Number);
    const totalMinuti = h * 60 + m + durataMinuti;
    const oreFine = Math.floor(totalMinuti / 60).toString().padStart(2, '0');
    const minFine = (totalMinuti % 60).toString().padStart(2, '0');
    return `${oreFine}:${minFine}`;
  }

  visualizzaReferto() {
    if (this.appuntamento.refertoUrl) {
      window.open(`${this.backendUrl}${this.appuntamento.refertoUrl}`, '_blank');
    }
  }

  scaricaReferto() {
    if (this.appuntamento.refertoUrl) {
      const link = document.createElement('a');
      link.href = `${this.backendUrl}${this.appuntamento.refertoUrl}`;
      link.download = this.appuntamento.refertoUrl.split('/').pop() ?? 'referto.pdf';
      link.click();
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
}
