import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private apiUrl = environment.apiUrl + '/sucursales';

  constructor(private http: HttpClient) {}

  getCiudades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ciudades`);
  }

  createCiudad(ciudad: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ciudades`, ciudad);
  }

  getSucursales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sucursales`);
  }

  createSucursal(sucursal: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sucursales`, sucursal);
  }

  updateSucursal(id: number, sucursal: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sucursales/${id}`, sucursal);
  }
}

