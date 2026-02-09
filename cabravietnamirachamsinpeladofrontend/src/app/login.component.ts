import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(private api: ApiService, private router: Router) {}

  login() {
    this.loading = true;
    this.error = '';
    this.api.login(this.username, this.password).subscribe({
      next: (resp: any) => {
        // Guardar token
        localStorage.setItem('token', resp.access || resp.token);
        
        // Guardar username por separado para asegurar que se muestre correctamente
        localStorage.setItem('username', this.username);
        
        console.log('Login successful, saved username:', this.username);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'Credenciales incorrectas';
        this.loading = false;
      }
    });
  }
}
