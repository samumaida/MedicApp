import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AppuntamentoConRelazioni } from '../../models/reservations.model';

@Component({
  selector: 'app-appuntamento-detail',
  standalone: true,
  imports: [IonicModule, CommonModule],
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
            <h3>{{ appuntamento.ora }}</h3>
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

        <ion-button expand="block" fill="clear" (click)="chiudi()">Chiudi</ion-button>

      </div>
    </ion-content>
  `
})
export class AppuntamentoDetailComponent {
  @Input() appuntamento!: AppuntamentoConRelazioni;
  @Input() ruoloUtente: 'operatore' | 'cliente' = 'cliente';

  constructor(private modalCtrl: ModalController) {}

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
}
