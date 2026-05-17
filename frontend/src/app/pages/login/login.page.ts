import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockDataService } from '../../services/mock-data';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  constructor(private router: Router, private mockService: MockDataService) { }

  ngOnInit() {}

  async onLogin() {
    // await this.mockService.loginAs('paziente');
    await this.mockService.loginAs('medico');
    this.router.navigate(['/home']);
  }
}