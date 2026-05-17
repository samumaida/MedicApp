import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, people, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline, peopleOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';
import { User, Appuntamento } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage {
  user: User | null;
  listaAppuntamenti: Appuntamento[];

  constructor(private mockService: MockDataService, private router: Router) {
    this.user = this.mockService.getCurrentUser();
    this.listaAppuntamenti = this.mockService.getAppuntamenti();
    addIcons({ logOutOutline, people, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline, peopleOutline });
  }

  logout() {
    this.mockService.logout(); // Pulisce il localStorage
    this.router.navigate(['/login']);
  }

  visualizzaReferto(url: string) {
    window.open(`assets/mock-pdf/${url}`, '_blank');
  }

  scaricaReferto(url: string) {
    const link = document.createElement('a');
    link.href = `assets/mock-pdf/${url}`;
    link.download = url;
    link.click();
  }

  navigaA(path: string) {
    this.router.navigate([path]);
  }
}