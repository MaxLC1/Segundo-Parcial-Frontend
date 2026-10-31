import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Catalogo } from '../../../services/catalogo';

@Component({
  selector: 'app-tallas-colores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tallas-colores.html',
  styleUrls: ['./tallas-colores.css']
})
export class TallasColores implements OnInit {
  tallas: any[] = [];
  colores: any[] = [];
  isLoadingTallas = false;
  isLoadingColores = false;

  nuevaTallaNombre = '';
  nuevoColorNombre = '';
  nuevoColorHex = '#000000';
  isSavingTalla = false;
  isSavingColor = false;

  colorMap: { [key: string]: string } = {
    'rojo': '#ef4444', 'azul': '#3b82f6', 'azul marino': '#1e3a8a',
    'verde': '#22c55e', 'amarillo': '#eab308', 'negro': '#000000',
    'blanco': '#ffffff', 'naranja': '#f97316', 'rosa': '#ec4899',
    'rosado': '#ec4899', 'morado': '#a855f7', 'purpura': '#a855f7',
    'gris': '#64748b', 'celeste': '#38bdf8', 'cafe': '#78350f',
    'marron': '#78350f', 'beige': '#f5f5dc', 'turquesa': '#14b8a6',
    'vino': '#7f1d1d', 'dorado': '#ca8a04', 'plateado': '#94a3b8',
    'lila': '#d8b4e2', 'fucsia': '#ff00ff', 'cyan': '#00ffff'
  };

  onColorNameChange(value: string) {
    if (!value) return;
    const key = value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (this.colorMap[key]) {
      this.nuevoColorHex = this.colorMap[key];
    }
  }

  constructor(private catalogo: Catalogo, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadTallas();
    this.loadColores();
  }

  loadTallas() {
    this.isLoadingTallas = true;
    this.cdr.detectChanges();
    this.catalogo.getTallas().subscribe({
      next: (data) => {
        this.tallas = data;
        this.isLoadingTallas = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadColores() {
    this.isLoadingColores = true;
    this.cdr.detectChanges();
    this.catalogo.getColores().subscribe({
      next: (data) => {
        this.colores = data;
        this.isLoadingColores = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarTalla() {
    if (!this.nuevaTallaNombre.trim()) return;
    this.isSavingTalla = true;
    this.cdr.detectChanges();
    this.catalogo.createTalla({ nombre: this.nuevaTallaNombre }).subscribe({
      next: () => {
        this.isSavingTalla = false;
        this.nuevaTallaNombre = '';
        this.loadTallas();
      }
    });
  }

  guardarColor() {
    if (!this.nuevoColorNombre.trim()) return;
    this.isSavingColor = true;
    this.cdr.detectChanges();
    this.catalogo.createColor({ nombre: this.nuevoColorNombre, codigo_hex: this.nuevoColorHex }).subscribe({
      next: () => {
        this.isSavingColor = false;
        this.nuevoColorNombre = '';
        this.nuevoColorHex = '#000000';
        this.loadColores();
      }
    });
  }
}

