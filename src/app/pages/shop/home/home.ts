import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Catalogo } from '../../../services/catalogo';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Home implements OnInit {
  productos: any[] = [];
  colecciones: any[] = [];
  isLoading = false;

  constructor(
    private catalogo: Catalogo, 
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Cargar productos con ofertas y temporadas pasadas
    this.catalogo.getProductosConOfertas(false).subscribe({
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


    // Cargar colecciones
    this.catalogo.getColecciones().subscribe({
      next: (res) => {
        this.colecciones = res;
        this.cdr.detectChanges();
      }
    });
  }

  addToCart(producto: any) {
    this.cartService.addToCart(producto);
    // Podríamos mostrar un pequeño toast aquí si queremos
  }

  scrollToCatalog() {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }
}

