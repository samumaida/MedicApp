import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Aggiungo il token JWT all'header di ogni richiesta HTTP in uscita
  const token = localStorage.getItem('access_token');

  const reqConToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqConToken).pipe(
    catchError((errore: HttpErrorResponse) => {
      // Se il token è scaduto o non valido effettuo il logout
      if (errore.status === 401) {
        console.warn('Token scaduto o non valido. Reindirizzamento al login.');
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => errore);
    })
  );
};
