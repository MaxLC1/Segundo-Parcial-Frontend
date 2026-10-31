import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Catalogo {
  private apiUrl = environment.apiUrl + '/catalogo';

  constructor(private http: HttpClient) { }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorias`);
  }

  createCategoria(categoria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categorias`, categoria);
  }

  updateCategoria(id: number, categoria: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categorias/${id}`, categoria);
  }

  deleteCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categorias/${id}`);
  }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos`);
  }

  getProductosConOfertas(esEmpleado: boolean = false, empresaId?: number): Observable<any[]> {
    const url = `${this.apiUrl}/productos-ofertas?es_empleado=${esEmpleado}` + (empresaId ? `&empresa_id=${empresaId}` : '');
    return this.http.get<any[]>(url);
  }

  getReglasOfertas(empresaId?: number): Observable<any[]> {
    const url = `${this.apiUrl}/reglas-ofertas` + (empresaId ? `?empresa_id=${empresaId}` : '');
    return this.http.get<any[]>(url);
  }


  createProducto(producto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/productos`, producto);
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${id}`, producto);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productos/${id}`);
  }

  getTallas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tallas`);
  }

  createTalla(talla: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tallas`, talla);
  }

  getColores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/colores`);
  }

  createColor(color: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/colores`, color);
  }

  getColecciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/colecciones`);
  }

  createColeccion(coleccion: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/colecciones`, coleccion);
  }

  updateColeccion(id: number, coleccion: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/colecciones/${id}`, coleccion);
  }

  deleteColeccion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/colecciones/${id}`);
  }
}

