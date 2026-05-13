import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
    events: [
      { 
        title: 'Visita Rossi', 
        start: '2026-05-20T09:00:00',
        end: '2026-05-20T10:00:00',
        color: '#3880ff' 
      },
      { 
        title: 'Chirurgia Bianchi', 
        start: '2026-05-20T11:00:00',
        end: '2026-05-20T13:00:00', 
        color: '#eb445a'
      },
      { 
        title: 'Traumatologia Verdone', 
        start: '2026-05-15T11:00:00',
        end: '2026-05-16T13:00:00', 
        color: '#44eb52'
      }
    ],

    locale: 'it',
    height: 'auto',
    editable: true,
    selectable: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
  };

  ngOnInit() {}

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
