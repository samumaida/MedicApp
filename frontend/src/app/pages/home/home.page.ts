import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { AppuntamentiApiService } from '../../services/appuntamenti-api.service';
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
  listaAppuntamenti: any[] = [];

  private authSubscription!: Subscription;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private appuntamentiApiService: AppuntamentiApiService
  ) {
    addIcons({ logOutOutline, calendar, documentTextOutline, addCircleOutline, downloadOutline, eyeOutline });
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (userData) => {
        this.user = userData;
        
        if (this.user && this.user.id) {
          console.log(`Utente loggato: ${this.user.nome} (${this.user.ruolo})`);
          this.caricaAppuntamentiOperatore();
        }
      },
      error: (err) => {
        console.error('Errore nella ricezione dei dati utente:', err);
      }
    });
  }

  caricaAppuntamentiOperatore() {
    if (!this.user || !this.user.id) return;

    // Se l'utente è un operatore
    if (this.user.ruolo === 'operatore') {
      this.appuntamentiApiService.getAppuntamentiPerOperatore(this.user.id).subscribe({
        next: (res) => {
          this.listaAppuntamenti = res;
          console.log('📅 Appuntamenti ricevuti per l\'operatore:', this.listaAppuntamenti);
        },
        error: (err) => console.error('Errore nel recupero appuntamenti operatore:', err)
      });
    } else {
      // Se l'utente è un cliente
      this.appuntamentiApiService.getAppuntamentiPerCliente(this.user.id).subscribe({
        next: (res) => {
          this.listaAppuntamenti = res;
          console.log('📅 Appuntamenti ricevuti per il cliente:', this.listaAppuntamenti);
        },
        error: (err) => console.error('Errore nel recupero appuntamenti cliente:', err)
      });
    }
  }

  logout() {
    this.authService.logout();
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