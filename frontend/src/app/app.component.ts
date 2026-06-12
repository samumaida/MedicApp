import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth';
import { addIcons } from 'ionicons';
import { appsOutline, calendarOutline, logOutOutline, addCircleOutline, personOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { User } from './models/user.model';
import { 
  IonApp, 
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonItem, 
  IonItemDivider, 
  IonLabel, 
  IonList, 
  IonMenu, 
  IonMenuToggle, 
  IonRouterOutlet, 
  IonTitle, 
  IonToolbar 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, 
    IonContent, 
    IonHeader, 
    IonIcon, 
    IonItem, 
    IonItemDivider, 
    IonLabel, 
    IonList, 
    IonMenu, 
    IonMenuToggle, 
    IonRouterOutlet, 
    IonTitle, 
    IonToolbar, 
    RouterModule, 
    CommonModule
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  user: User | null = null;
  private authSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ appsOutline, calendarOutline, logOutOutline, addCircleOutline, personOutline });
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe({
      next: (utenteLoggato) => {
        this.user = utenteLoggato;
      },
      error: (err) => {
        console.error('Errore nel tracciare l\'utente in AppComponent:', err);
      }
    });
  }

  globalLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}