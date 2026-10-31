import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Catalogo } from '../../../services/catalogo';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class Categorias implements OnInit {
  categorias: any[] = [];
  isLoading = false;
  
  // Modal state
  showModal = false;
  nuevaCategoria = { nombre: '', descripcion: '', activo: true };
  editingId: number | null = null;
  isSaving = false;

  constructor(private catalogoService: Catalogo, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.catalogoService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert("Error cargando categorías: " + (err.error?.detail || err.message));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.nuevaCategoria = { nombre: '', descripcion: '', activo: true };
    this.editingId = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  editCategoria(c: any) {
    this.editingId = c.id;
    this.nuevaCategoria = {
      nombre: c.nombre,
      descripcion: c.descripcion,
      activo: c.activo
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  guardarCategoria() {
    if (!this.nuevaCategoria.nombre) return;
    
    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.editingId) {
      this.catalogoService.updateCategoria(this.editingId, this.nuevaCategoria).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.closeModal();
          this.loadCategorias();
        },
        error: (err) => {
          alert("Error al actualizar la categoría: " + (err.error?.detail || err.message));
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.catalogoService.createCategoria(this.nuevaCategoria).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.closeModal();
          this.loadCategorias();
        },
        error: (err) => {
          alert("Error al crear la categoría: " + (err.error?.detail || err.message));
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteCategoria(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.catalogoService.deleteCategoria(id).subscribe({
        next: () => {
          this.loadCategorias();
        },
        error: (err) => {
          alert("Error eliminando categoría: " + (err.error?.detail || err.message));
        }
      });
    }
  }
}

