import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = environment.apiUrl + '/catalogo/proveedores';

  constructor(private http: HttpClient) { }

  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProveedor(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearProveedor(proveedor: any): Observable<any> {
    return this.http.post(this.apiUrl, proveedor);
  }

  updateProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, proveedor);
  }
}
