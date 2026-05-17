import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { MockDataService } from './services/mock-data';
import { addIcons } from 'ionicons';
import { appsOutline, calendarOutline, logOutOutline, addCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
})
export class AppComponent {
  user: any;

  constructor(private mockService: MockDataService, private router: Router) {
    addIcons({ appsOutline, calendarOutline, logOutOutline, addCircleOutline });
  }

  ngOnInit() {
    this.mockService.user$.subscribe(utenteLoggato => {
      this.user = utenteLoggato;
      console.log('AppComponent ha intercettato il cambio utente:', this.user);
    });
  }

  globalLogout() {
    this.mockService.logout();
    this.router.navigate(['/login']);
  }
}