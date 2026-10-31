import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Catalogo } from '../../../services/catalogo';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-shop-colecciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colecciones.html',
  styleUrls: ['./colecciones.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ShopColecciones implements OnInit {
  colecciones: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  isLoading = false;

  selectedTalla: { [productoId: number]: number } = {};
  selectedColor: { [productoId: number]: number } = {};

  constructor(
    private catalogo: Catalogo, 
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Cargar colecciones, tallas y colores
    this.catalogo.getTallas().subscribe(res => this.tallas = res);
    this.catalogo.getColores().subscribe(res => this.colores = res);

    this.catalogo.getColecciones().subscribe({
      next: (res) => {
        this.colecciones = res;
        this.loadProductos();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProductos() {
    this.catalogo.getProductos().subscribe({
      next: (res) => {
        this.productos = res;
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

  getProductosPorColeccion(coleccionId: number) {
    return this.productos.filter(p => p.coleccion_id === coleccionId);
  }

  getProductosSinColeccion() {
    return this.productos.filter(p => !p.coleccion_id);
  }

  viewMode: { [key: number]: '2D' | '3D' } = {};

  toggleView(producto: any) {
    const current = this.getViewMode(producto);
    this.viewMode[producto.id] = current === '2D' ? '3D' : '2D';
    this.cdr.detectChanges();
  }

  getViewMode(producto: any): '2D' | '3D' {
    if (this.viewMode[producto.id]) {
      return this.viewMode[producto.id];
    }
    // Si no tiene preferencia guardada, pero tiene modelo 3D, mostramos 3D por defecto, si no, 2D
    return producto.modelo_3d_url ? '3D' : '2D';
  }

  addToCart(producto: any) {
    const tId = this.selectedTalla[producto.id];
    const cId = this.selectedColor[producto.id];
    
    if (!tId || !cId) {
      alert("Por favor selecciona una talla y un color antes de añadir al carrito.");
      return;
    }
    
    this.cartService.addToCart(producto, 1, tId, cId);
  }
}
