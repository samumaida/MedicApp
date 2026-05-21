import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';
import { User, Appuntamento } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit, OnDestroy {
  user: User | null = null;
  listaAppuntamenti: Appuntamento[];

  private authSubscription!: Subscription;

  constructor(private mockService: MockDataService, private router: Router, private authService: AuthService,) {
    this.listaAppuntamenti = this.mockService.getAppuntamenti();
    addIcons({ logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline });
  }

  ngOnInit() {
    // Mi iscrivo all'observable per ricevere l'utente reale dal DB
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (userData) => {
        this.user = userData;
        
        if (this.user) {
          console.log(`Utente loggato: ${JSON.stringify(this.user)}`);
        }
      },
      error: (err) => {
        console.error('Errore nella ricezione dei dati utente:', err);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.mockService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    // Disiscrivo l'observable quando la pagina viene distrutta
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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