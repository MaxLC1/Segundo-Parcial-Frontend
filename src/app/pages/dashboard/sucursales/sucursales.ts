import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService } from '../../../services/sucursales';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.html',
  styleUrls: ['./sucursales.css']
})
export class Sucursales implements OnInit {
  listaSucursales: any[] = [];
  ciudades: any[] = [];
  isLoading = false;
  
  showModal = false;
  isSaving = false;
  isEditing = false;
  currentSucursalId: number | null = null;
  
  // Registration form
  nombre = '';
  direccion = '';
  ciudad_id: number | null = null;

  errorMsg = '';

  constructor(
    private sucursales: SucursalesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSucursales();
    this.loadCiudades();
  }

  loadSucursales() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.sucursales.getSucursales().subscribe({
      next: (data) => {
        this.listaSucursales = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCiudades() {
    this.sucursales.getCiudades().subscribe({
      next: (data) => {
        this.ciudades = data;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.isEditing = false;
    this.currentSucursalId = null;
    this.nombre = '';
    this.direccion = '';
    this.ciudad_id = null;
    this.errorMsg = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  editarSucursal(s: any) {
    this.isEditing = true;
    this.currentSucursalId = s.id;
    this.nombre = s.nombre;
    this.direccion = s.direccion;
    this.ciudad_id = s.ciudad?.id || null;
    this.errorMsg = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardar() {
    if (!this.nombre || !this.ciudad_id) {
      this.errorMsg = 'Por favor, llena los campos requeridos.';
      return;
    }
    
    this.errorMsg = '';
    this.isSaving = true;
    this.cdr.detectChanges();
    
    const payload = {
      nombre: this.nombre,
      direccion: this.direccion,
      ciudad_id: this.ciudad_id
    };

    const obs = this.isEditing
      ? this.sucursales.updateSucursal(this.currentSucursalId!, payload)
      : this.sucursales.createSucursal(payload);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadSucursales();
      },
      error: (err) => {
        this.errorMsg = 'Ocurrió un error al guardar la sucursal.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
