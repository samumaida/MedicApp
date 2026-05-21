import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'agenda',
    loadComponent: () => import('./pages/agenda/agenda.page').then( m => m.AgendaPage),
    canActivate: [authGuard]
  },
  {
    path: 'prenota-appuntamento',
    loadComponent: () => import('./pages/prenota-appuntamento/prenota-appuntamento.page').then( m => m.PrenotaAppuntamentoPage),
    canActivate: [authGuard]
  },  {
    path: 'prestazioni',
    loadComponent: () => import('./pages/prestazioni/prestazioni.page').then( m => m.PrestazioniPage)
  },

];
