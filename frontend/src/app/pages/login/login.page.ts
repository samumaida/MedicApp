import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {
  // Controlla quale vista mostrare tra 'login' o 'register'
  segmentModel: 'login' | 'register' = 'login';

  loginData = {
    email: '',
    password: ''
  };

  registerData = {
    nome: '',
    cognome: '',
    codiceFiscale: '',
    dataNascita: '',
    sesso: 'M',
    email: '',
    password: '',
    ruolo: 'cliente'
  };

  showPassword = false;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private toastCtrl: ToastController
  ) { 
    addIcons({ eyeOutline, eyeOffOutline });
   }

  ngOnInit() {}

  // Gestisce il cambio di tab tra Accedi e Registrati
  segmentChanged(event: any) {
    this.segmentModel = event.detail.value;
  }

  async onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.presentToast('Inserisci email e password', 'danger');
      return;
    }

    console.log('Dati inviati per il login:', this.loginData);
    
    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        this.presentToast(res.message || 'Bentornato!', 'success');
        
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Errore login:', err);
        const msg = err.error?.message || 'Errore di connessione al server';
        this.presentToast(msg, 'danger');
      }
    });
  }

  onRegister() {
    if (!this.registerData.nome || !this.registerData.cognome || !this.registerData.email || !this.registerData.password) {
      this.presentToast('Compila tutti i campi obbligatori (*)', 'danger');
      return;
    }

    // Passo l'intero oggetto registerData a NestJS
    this.authService.register(this.registerData).subscribe({
      next: (res) => {
        this.presentToast('Registrazione completata con successo! Ora puoi accedere.', 'success');
        this.segmentModel = 'login'; // Sposto l'utente automaticamente sul tab di Login
      },
      error: (err) => {
        console.error('Errore registrazione:', err);
        // Intercetto eventuali errori di mail duplicata o fallita validazione
        const msg = err.error?.message || 'Impossibile completare la registrazione';
        
        // Gestisco Se NestJS restituisce un array di errori di validazione
        const errorText = Array.isArray(msg) ? msg.join(', ') : msg;
        this.presentToast(errorText, 'danger');
      }
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}