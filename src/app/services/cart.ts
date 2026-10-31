import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  producto: any;
  cantidad: number;
  talla_id?: number;
  color_id?: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  addToCart(producto: any, cantidad: number = 1, talla_id?: number, color_id?: number) {
    const precioEfectivo = (producto.precio_oferta && producto.precio_oferta < producto.precio) 
      ? producto.precio_oferta 
      : producto.precio;

    const existing = this.cartItems.find(item => item.producto.id === producto.id);
    if (existing) {
      existing.cantidad += cantidad;
      existing.subtotal = Math.round(existing.cantidad * precioEfectivo * 100) / 100;
    } else {
      this.cartItems.push({
        producto,
        cantidad,
        talla_id,
        color_id,
        subtotal: Math.round(precioEfectivo * cantidad * 100) / 100
      });
    }
    this.cartSubject.next(this.cartItems);
  }

  removeFromCart(index: number) {
    this.cartItems.splice(index, 1);
    this.cartSubject.next(this.cartItems);
  }

  getCantidadTotalPrendas(): number {
    return this.cartItems.reduce((acc, item) => acc + item.cantidad, 0);
  }

  getSubtotalSinMayoreo(): number {
    return Math.round(this.cartItems.reduce((acc, item) => acc + item.subtotal, 0) * 100) / 100;
  }

  getDescuentoMayoreo(): number {
    const totalPrendas = this.getCantidadTotalPrendas();
    if (totalPrendas >= 3) {
      // Regla de mayoreo: 15% de descuento directo sobre la compra de 3 o más prendas
      return Math.round(this.getSubtotalSinMayoreo() * 0.15 * 100) / 100;
    }
    return 0.0;
  }

  getTotal(): number {
    const subtotal = this.getSubtotalSinMayoreo();
    const descuento = this.getDescuentoMayoreo();
    return Math.max(0, Math.round((subtotal - descuento) * 100) / 100);
  }

  clearCart() {
    this.cartItems = [];
    this.cartSubject.next(this.cartItems);
  }
}


