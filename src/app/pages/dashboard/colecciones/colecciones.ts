import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Catalogo } from '../../../services/catalogo';

@Component({
  selector: 'app-colecciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colecciones.html',
  styleUrls: ['./colecciones.css']
})
export class Colecciones implements OnInit {
  colecciones: any[] = [];
  isLoading = false;
  
  // Modal state
  showModal = false;
  nuevaColeccion = { nombre: '' };
  editingId: number | null = null;
  isSaving = false;

  constructor(private catalogoService: Catalogo, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadColecciones();
  }

  loadColecciones() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.catalogoService.getColecciones().subscribe({
      next: (data) => {
        this.colecciones = data;
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
    this.nuevaColeccion = { nombre: '' };
    this.editingId = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  editColeccion(c: any) {
    this.editingId = c.id;
    this.nuevaColeccion = { nombre: c.nombre };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardarColeccion() {
    if (!this.nuevaColeccion.nombre) return;
    
    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.editingId) {
      this.catalogoService.updateColeccion(this.editingId, this.nuevaColeccion).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.closeModal();
          this.loadColecciones();
        },
        error: (err) => {
          console.error(err);
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.catalogoService.createColeccion(this.nuevaColeccion).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.closeModal();
          this.loadColecciones();
        },
        error: (err) => {
          console.error(err);
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteColeccion(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta colección?')) {
      this.catalogoService.deleteColeccion(id).subscribe({
        next: () => {
          this.loadColecciones();
        },
        error: (err) => {
          console.error('Error eliminando colección:', err);
        }
      });
    }
  }
}

