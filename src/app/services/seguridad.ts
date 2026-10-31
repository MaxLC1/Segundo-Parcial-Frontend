import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private apiUrl = environment.apiUrl + '/seguridad';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`);
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  updateUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, data);
  }
}

