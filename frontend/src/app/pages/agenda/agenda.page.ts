import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MockDataService } from '../../services/mock-data';
import { User } from '../../models/user.model';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule, 
    FormsModule, 
    FullCalendarModule
  ]
})

export class AgendaPage implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  currentUser: User | null = null;

  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: this.getInitialView(),
    headerToolbar: {
      left: window.innerWidth < 768 ? 'prev,next' : 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    views: {
      timeGridThreeDay: {
        type: 'timeGrid',
        duration: { days: 3 },
        buttonText: '3 giorni'
      }
    },
    events: [],

    locale: 'it',
    height: 'auto',
    editable: true,
    selectable: true,

    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,

    slotDuration: '00:30:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },

    // Forza il formato orario degli eventi per non troncare minuti se pari a 00
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false // Evita il formato AM/PM americano
    },

    eventClick: this.handleEventClick.bind(this)
  };

  constructor(
    private alertCtrl: AlertController, 
    private toastCtrl: ToastController,
    private authService: AuthService,
    private appuntamentiApiService: AppuntamentiApiService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser && this.currentUser.id) {
        this.caricaAppuntamentiSuCalendario();
      }
    });
  }

  caricaAppuntamentiSuCalendario() {
    if (!this.currentUser || !this.currentUser.id) return;

    // Scelgo dinamicamente il flusso API corretto in base al ruolo dell'utente loggato
    const rinvioApi$ = this.currentUser.ruolo === 'operatore'
      ? this.appuntamentiApiService.getAppuntamentiPerOperatore(this.currentUser.id)
      : this.appuntamentiApiService.getAppuntamentiPerCliente(this.currentUser.id);

    // Avvio la richiesta su Postgres
    rinvioApi$.subscribe({
      next: (appuntamentiRaw) => {
        console.log('Dati grezzi ricevuti dal DB per l\'agenda:', appuntamentiRaw);
        
        // Trasformo i dati nel formato accettato da FullCalendar
        const eventiFormattati = appuntamentiRaw.map(app => {
          const dataInizio = `${app.data}T${app.ora}:00`;
          
          const oreMinuti = app.ora.split(':');
          const oraFineCorretta = (parseInt(oreMinuti[0]) + 1).toString().padStart(2, '0');
          const dataFine = `${app.data}T${oraFineCorretta}:${oreMinuti[1]}:00`;

          // Se sono il medico voglio vedere il Paziente, se sono il Paziente voglio vedere il Medico
          const titoloMostrato = this.currentUser?.ruolo === 'operatore'
            ? `${app.prestazione?.nome} - Paziente: ${app.paziente?.nome} ${app.paziente?.cognome}`
            : `${app.prestazione?.nome} - Dott. ${app.operatore?.nome} ${app.operatore?.cognome}`;

          return {
            id: app.id,
            title: titoloMostrato,
            start: dataInizio,
            end: dataFine,
            color: app.stato === 'confermato' ? '#2dd36f' : '#ffc409',

            extendedProps: {
              stato: app.stato,
              ora: app.ora,
              data: app.data,
              clienteNome: app.paziente ? `${app.paziente.nome} ${app.paziente.cognome}` : 'N/D',
              operatoreNome: app.operatore ? `Dott. ${app.operatore.cognome}` : 'N/D'
            }
          };
        });

        console.log('Eventi formattati per FullCalendar:', eventiFormattati);
        
        // Aggiorno le opzioni del calendario per mostrare i blocchi visivi completi
        this.calendarOptions = {
          ...this.calendarOptions,
          events: eventiFormattati
        };
      },
      error: (err) => console.error('Errore nel caricamento del calendario:', err)
    });
  }

  // GESTIONE DEL POPUP DETTAGLI / ELIMINAZIONE
  async handleEventClick(info: any) {
    const evento = info.event;
    const idAppuntamento = evento.id; 
    const props = evento.extendedProps;

    // Se props.data è undefined, estraggo la data direttamente dall'oggetto 'start' di FullCalendar
    let dataFormattata = '';
    if (props && props.data) {
      dataFormattata = props.data.split('-').reverse().join('/');
    } else if (evento.start) {
      // Formatto la data nativa (Date object) in GG/MM/AAAA
      const d = evento.start;
      dataFormattata = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    // Recupero dell'orario
    let orarioMostrato = '';
    if (props && props.ora) {
      orarioMostrato = props.ora;
    } else if (evento.start) {
      orarioMostrato = `${evento.start.getHours().toString().padStart(2, '0')}:${evento.start.getMinutes().toString().padStart(2, '0')}`;
    }

    // Recupero dello stato
    const statoAttuale = props && props.stato ? props.stato.toUpperCase() : 'IN ATTESA';
    const clienteMostrato = props && props.clienteNome ? props.clienteNome : 'N/D';
    const operatoreMostrato = props && props.operatoreNome ? props.operatoreNome : 'N/D';

    const bottoniAlert: any[] = [
      {
        text: 'Chiudi',
        role: 'cancel',
        cssClass: 'secondary'
      }
    ];

    // Se l'utente loggato è un 'operatore' e l'appuntamento è 'in attesa', aggiungo i comandi di approvazione
    if (this.currentUser?.ruolo === 'operatore' && statoAttuale === 'IN ATTESA') {
      bottoniAlert.push({
        text: 'Accetta Appuntamento',
        role: 'confirm',
        handler: () => {
          this.cambiaStatoEInforma(idAppuntamento, 'confermato', 'Appuntamento approvato e inserito in agenda.');
        }
      });
      
      bottoniAlert.push({
        text: 'Rifiuta',
        handler: () => {
          this.cambiaStatoEInforma(idAppuntamento, 'rifiutato', 'Appuntamento rifiutato.');
        }
      });
    }

    bottoniAlert.push({
      text: 'Elimina Prenotazione',
      role: 'destructive',
      handler: () => {
        this.mostraConfermaCancellazione(idAppuntamento);
      }
    });

    const alert = await this.alertCtrl.create({
      header: evento.title,
      subHeader: this.currentUser?.ruolo === 'operatore' ? `Cliente: ${clienteMostrato}` : `Operatore: ${operatoreMostrato}`,
      message: `📅 Giorno: ${dataFormattata}\n\n⏰ Orario: ${orarioMostrato}\n\n📌 Stato: ${statoAttuale.replace('_', ' ')}`,
      buttons: bottoniAlert
    });

    await alert.present();
  }

  cambiaStatoEInforma(id: string, nuovoStato: 'confermato' | 'rifiutato', messaggioToast: string) {
    this.appuntamentiApiService.patchStatoAppuntamento(id, nuovoStato).subscribe({
      next: async (res) => {
        if (res.success) {
          // Ricarico i dati  da Postgres per aggiornare gli appuntamenti sul calendario
          this.caricaAppuntamentiSuCalendario();

          const toast = await this.toastCtrl.create({
            message: messaggioToast,
            duration: 2500,
            color: nuovoStato === 'confermato' ? 'success' : 'warning',
            position: 'bottom'
          });
          await toast.present();
        }
      },
      error: async (err) => {
        console.error("Errore durante l'aggiornamento dello stato:", err);
        const toast = await this.toastCtrl.create({
          message: "Impossibile aggiornare l'appuntamento sul server.",
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  async mostraConfermaCancellazione(id: string) {
    const alertConferma = await this.alertCtrl.create({
      header: 'Sei sicuro?',
      message: 'Vuoi davvero cancellare questo appuntamento? L\'azione non è reversibile.',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Sì, Elimina',
          role: 'destructive',
          handler: () => {
            this.cancellaAppuntamento(id);
          }
        }
      ]
    });

    await alertConferma.present();
  }

  cancellaAppuntamento(id: string) {
    this.appuntamentiApiService.eliminaAppuntamento(id).subscribe({
      next: async (res) => {
        if (res.success) {
          // Ricarico i dati aggiornati da Postgres per rimuovere il blocco visivo dal calendario
          this.caricaAppuntamentiSuCalendario();

          const toast = await this.toastCtrl.create({
            message: 'Appuntamento cancellato con successo.',
            duration: 2500,
            color: 'success',
            position: 'bottom'
          });
          await toast.present();
        }
      },
      error: async (err) => {
        console.error("Errore durante l'eliminazione dell'appuntamento:", err);
        const toast = await this.toastCtrl.create({
          message: "Impossibile cancellare l'appuntamento dal server.",
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  getInitialView() {
    if (window.innerWidth < 768) {
      return 'timeGridThreeDay'; // Vista 3 giorni per mobile
    }
    return 'timeGridWeek'; // Settimana classica per desktop
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const calendarApi = this.calendarComponent.getApi();
    const width = event.target.innerWidth;
    if (width < 768) {
      calendarApi.changeView('timeGridThreeDay');
      calendarApi.setOption('headerToolbar', {
        left: 'prev,next',
        center: 'title',
        right: ''
      });
    } else {
      calendarApi.changeView('timeGridWeek');
      calendarApi.setOption('headerToolbar', {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      });
    }
  }
}
