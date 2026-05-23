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

  constructor(private mockService: MockDataService, private alertCtrl: AlertController, private toastCtrl: ToastController) {}

  ngOnInit() {
    this.mockService.user$.subscribe(user => {
      this.currentUser = user;
    });
    this.caricaAppuntamentiSuCalendario();
  }

  caricaAppuntamentiSuCalendario() {
    // Recupero la lista centralizzata
    const appuntamentiRaw = this.mockService.getAppuntamenti();

    // Trasformo i dati nel formato accettato da FullCalendar
    const eventiFormattati = appuntamentiRaw.map(app => {
      // Unisco 'data' (2026-05-20) e 'ora' (09:00) nel formato ISO richiesto (2026-05-20T09:00:00)
      const dataInizio = `${app.data}T${app.ora}:00`;
      
      // Calcolo un'ora di fine come standard
      const oreMinuti = app.ora.split(':');
      const oraFineCorretta = (parseInt(oreMinuti[0]) + 1).toString().padStart(2, '0');
      const dataFine = `${app.data}T${oraFineCorretta}:${oreMinuti[1]}:00`;

      return {
        id: app.id.toString(),
        title: app.prestazione,
        start: dataInizio,
        end: dataFine,
        color: app.stato === 'confermato' ? '#2DD55B' 
                : app.stato === 'completato' ? '#3880ff' 
                : app.stato === 'rifiutato' ? '#eb445a' 
                  : '#ffc409',
        extendedProps: {
          clienteNome: app.clienteNome,
          ora: app.ora,
          data: app.data,
          stato: app.stato
        }
      };
    });

    // Aggiorno le opzioni del calendario per forzare il rendering dei nuovi dati
    this.calendarOptions.events = eventiFormattati;
  }

  // GESTIONE DEL POPUP DETTAGLI / ELIMINAZIONE
  async handleEventClick(info: any) {
    const evento = info.event;
    const idAppuntamento = parseInt(evento.id);
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
    const operatoreMostrato = this.currentUser?.ruolo === 'operatore' ? clienteMostrato : evento.extendedProps.operatoreNome || 'N/D';

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
      message: `📅 Giorno: ${dataFormattata}\n\n⏰ Orario: ${orarioMostrato}\n\n📌 Stato: ${statoAttuale.toUpperCase().replace('_', ' ')}`,
      buttons: bottoniAlert
    });

    await alert.present();
  }

  async cambiaStatoEInforma(id: number, nuovoStato: 'confermato' | 'rifiutato', messaggioToast: string) {
    // 1. Aggiorna sul servizio mock
    this.mockService.updateStatoAppuntamento(id, nuovoStato);
    
    // 2. Ricarica i dati locali per aggiornare i colori su FullCalendar
    this.caricaAppuntamentiSuCalendario();

    // 3. Mostra la notifica di successo
    const toast = await this.toastCtrl.create({
      message: messaggioToast,
      duration: 2500,
      color: nuovoStato === 'confermato' ? 'success' : 'warning',
      position: 'bottom'
    });
    await toast.present();
  }

async mostraConfermaCancellazione(id: number) {
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

  async cancellaAppuntamento(id: number) {
    this.mockService.removeAppuntamento(id);

    this.caricaAppuntamentiSuCalendario();

    const toast = await this.toastCtrl.create({
      message: 'Appuntamento cancellato con successo.',
      duration: 2500,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
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
