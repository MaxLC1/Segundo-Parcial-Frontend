import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../../services/seguridad';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil implements OnInit {
  usuario: any = null;
  isLoading = false;

  newPassword = '';
  isSaving = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private seguridad: SeguridadService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMyProfile();
  }

  loadMyProfile() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Obtener los datos directamente del token de sesión (JWT)
    this.usuario = {
      id: this.auth.getEmail(), // Por ahora usamos email como ID o se deberia agregar ID al JWT
      nombre_completo: this.auth.getName(),
      email: this.auth.getEmail(),
      rol_nombre: this.auth.getRole()
    };
    
    // Si queremos el ID real para cambiar password, el JWT en router.py ya inyecta "id"
    // Pero auth.ts no expone getId(). Extraigámoslo:
    const token = this.auth.getToken();
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        this.usuario.id = payload.id;
      } catch (e) {}
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  cambiarPassword() {
    if (!this.newPassword || !this.usuario) return;
    this.isSaving = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.cdr.detectChanges();

    this.seguridad.changePassword({ user_id: this.usuario.id, new_password: this.newPassword }).subscribe({
      next: (res) => {
        this.successMsg = '¡Contraseña actualizada exitosamente!';
        this.newPassword = '';
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.error && err.error.detail) {
           if (Array.isArray(err.error.detail)) {
               this.errorMsg = err.error.detail[0].msg;
           } else {
               this.errorMsg = err.error.detail;
           }
        } else {
           this.errorMsg = 'Error al actualizar contraseña.';
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

