import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: Auth, private router: Router, private cdr: ChangeDetectorRef) {}

  onSubmit() {
    if (!this.email || !this.password) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        // Guardar token y navegar al dashboard
        localStorage.setItem('token', res.access_token);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales incorrectas o error en el servidor.';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}

