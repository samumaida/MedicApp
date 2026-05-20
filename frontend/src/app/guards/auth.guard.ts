import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se l'utente ha il token nel localStorage può accedere alla pagina
  if (authService.isLoggedIn()) {
    return true;
  }

  // Altrimenti viene rimandato alla login page
  console.warn('Accesso negato: Token mancante. Reindirizzamento al login.');
  router.navigate(['/login']);
  return false;
};