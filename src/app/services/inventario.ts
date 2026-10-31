import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private apiUrl = environment.apiUrl + '/sucursales';

  constructor(private http: HttpClient) {}

  getInventarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventarios`);
  }

  addInventario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventarios`, data);
  }

  updateInventario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/inventarios/${id}`, data);
  }
}

