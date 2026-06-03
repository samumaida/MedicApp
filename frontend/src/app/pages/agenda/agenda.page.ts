import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AppuntamentoDetailComponent } from '../../components/appuntamento-detail/appuntamento-detail.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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
    FullCalendarModule,
    AppuntamentoDetailComponent
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
    private modalCtrl: ModalController,
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

  ionViewWillEnter() {
    if (this.currentUser && this.currentUser.id) {
      this.caricaAppuntamentiSuCalendario();
    }
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
        const oggi = new Date().toISOString().split('T')[0];

        const eventiFormattati = appuntamentiRaw.map(app => {
          const dataInizio = `${app.data}T${app.ora}:00`;

          // Calcolo la fine sommando la durata della prestazione
          const durataMinuti = app.prestazione?.durataMinuti ?? 60;
          const [oreInizio, minInizio] = app.ora.split(':').map(Number);
          const totalMinutiFine = oreInizio * 60 + minInizio + durataMinuti;
          const oreFine = Math.floor(totalMinutiFine / 60).toString().padStart(2, '0');
          const minFine = (totalMinutiFine % 60).toString().padStart(2, '0');
          const dataFine = `${app.data}T${oreFine}:${minFine}:00`;

          // Se sono l'operatore voglio vedere il cliente, se sono il cliente voglio vedere l'operatore
          const titoloMostrato = this.currentUser?.ruolo === 'operatore'
            ? `${app.prestazione?.nome} - Paziente: ${app.cliente?.nome} ${app.cliente?.cognome}`
            : `${app.prestazione?.nome} - Dott. ${app.operatore?.nome} ${app.operatore?.cognome}`;

          // Se la data è passata e l'appuntamento non è rifiutato allora lo tratto come completato
          const isPassato = String(app.data).split('T')[0] < oggi;
          const statoEffettivo = isPassato && app.stato !== 'rifiutato' ? 'completato' : app.stato;

          // Coloro l'evento in base allo stato
          const coloreEvento =
            statoEffettivo === 'completato' ? '#3880ff' :
            statoEffettivo === 'confermato' ? '#2dd36f' :
            statoEffettivo === 'rifiutato'  ? '#eb445a' :
                                              '#ffc409';

          return {
            id: app.id,
            title: titoloMostrato,
            start: dataInizio,
            end: dataFine,
            color: coloreEvento,

            extendedProps: {
              stato: statoEffettivo,
              ora: app.ora,
              data: app.data,
              clienteNome: app.cliente ? `${app.cliente.nome} ${app.cliente.cognome}` : 'N/D',
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

  // Apre la modal di dettaglio al click su un evento del calendario
  async handleEventClick(info: any) {
    const evento = info.event;
    const props = evento.extendedProps;

    // Ricostruisco l'oggetto appuntamento nel formato atteso dalla modal
    const appuntamento = {
      id: evento.id,
      stato: props.stato || 'in attesa',
      data: props.data || evento.start?.toISOString().split('T')[0],
      ora: props.ora || `${evento.start?.getHours().toString().padStart(2, '0')}:${evento.start?.getMinutes().toString().padStart(2, '0')}`,
      prestazione: { 
        nome: evento.title?.split(' - ')[0], 
        durataMinuti: evento.end && evento.start // Calcolo la differenza in minuti tra start e end per avere la durata dell'appuntamento
          ? Math.round((evento.end.getTime() - evento.start.getTime()) / 60000)
          : 60 },
      cliente: { nome: props.clienteNome || '', cognome: '' },
      operatore: { nome: props.operatoreNome || '', cognome: '' }
    };

    const modal = await this.modalCtrl.create({
      component: AppuntamentoDetailComponent,
      componentProps: {
        appuntamento,
        ruoloUtente: this.currentUser?.ruolo
      },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    if (data.azione === 'conferma') {
      this.cambiaStatoEInforma(data.id, 'confermato', 'Appuntamento approvato e inserito in agenda.');
    } else if (data.azione === 'rifiuta') {
      this.cambiaStatoEInforma(data.id, 'rifiutato', 'Appuntamento rifiutato.');
    } else if (data.azione === 'elimina') {
      this.mostraConfermaCancellazione(data.id);
    }
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
    this.cancellaAppuntamento(id);
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
