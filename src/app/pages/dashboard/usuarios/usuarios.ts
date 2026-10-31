import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../../services/seguridad';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  roles: any[] = [];
  isLoading = false;

  showModal = false;
  isSaving = false;
  isEditing = false;
  currentUserId: number | null = null;
  
  // Form fields
  nombre = '';
  email = '';
  password = '';
  rol_id: number | null = null;
  is_active = true;
  errorMsg = '';

  constructor(
    private seguridad: SeguridadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsuarios();
    this.loadRoles();
  }

  loadUsuarios() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.seguridad.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRoles() {
    this.seguridad.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.isEditing = false;
    this.currentUserId = null;
    this.nombre = '';
    this.email = '';
    this.password = '';
    this.rol_id = null;
    this.is_active = true;
    this.errorMsg = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  editarUsuario(u: any) {
    this.isEditing = true;
    this.currentUserId = u.id;
    this.nombre = u.nombre_completo;
    this.email = u.email;
    this.password = ''; // Opcional al editar
    this.rol_id = u.rol?.id || null;
    this.is_active = u.is_active;
    this.errorMsg = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardar() {
    if (!this.nombre || !this.email || !this.rol_id || (!this.isEditing && !this.password)) {
      this.errorMsg = 'Por favor, llena los campos requeridos.';
      return;
    }
    
    this.errorMsg = '';
    this.isSaving = true;
    this.cdr.detectChanges();
    
    const payload: any = {
      nombre_completo: this.nombre,
      email: this.email,
      rol_id: this.rol_id,
      is_active: this.is_active
    };

    if (this.password) {
      payload.password = this.password;
    }

    const obs = this.isEditing 
      ? this.seguridad.updateUsuario(this.currentUserId!, payload)
      : this.seguridad.register(payload);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadUsuarios();
      },
      error: (err) => {
        if (err.error && err.error.detail) {
           if (Array.isArray(err.error.detail)) {
               this.errorMsg = err.error.detail[0].msg;
           } else {
               this.errorMsg = err.error.detail;
           }
        } else {
           this.errorMsg = 'Error de conexión con el servidor.';
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

