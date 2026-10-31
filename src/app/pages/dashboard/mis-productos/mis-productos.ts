import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-productos.html',
  styleUrls: ['./mis-productos.css']
})
export class MisProductos implements OnInit {
  productos: any[] = [];
  isLoading = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarMisProductos();
  }

  async cargarMisProductos() {
    this.isLoading = true;
    try {
      const res = await fetch(`${API_URL}/catalogo/productos/`);
      const todos = await res.json();
      
      // En la base de datos "Proveedor Textil" es un proveedor (id 1)
      // Como esto es una prueba rápida, simularemos que ve todos los que tengan proveedor asignado
      this.productos = todos.filter((p: any) => p.proveedor_id != null);
    } catch (e) {
      console.error(e);
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}

