import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../../../services/proveedores';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styleUrls: ['./proveedores.css']
})
export class Proveedores implements OnInit {
  proveedores: any[] = [];
  isLoading = false;
  
  showModal = false;
  nuevoProveedor = { nombre: '', contacto: '' };
  editingId: number | null = null;
  isSaving = false;

  constructor(private proveedoresService: ProveedoresService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadProveedores();
  }

  loadProveedores() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.proveedoresService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.nuevoProveedor = { nombre: '', contacto: '' };
    this.editingId = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  editProveedor(p: any) {
    this.editingId = p.id;
    this.nuevoProveedor = {
      nombre: p.nombre,
      contacto: p.contacto || ''
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardarProveedor() {
    if (!this.nuevoProveedor.nombre) return;
    
    this.isSaving = true;
    this.cdr.detectChanges();

    const obs = this.editingId
      ? this.proveedoresService.updateProveedor(this.editingId, this.nuevoProveedor)
      : this.proveedoresService.crearProveedor(this.nuevoProveedor);

    obs.subscribe({
      next: (res) => {
        this.isSaving = false;
        this.closeModal();
        this.loadProveedores();
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

