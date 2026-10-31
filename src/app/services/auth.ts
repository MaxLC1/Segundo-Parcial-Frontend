import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = environment.apiUrl + '/seguridad';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.rol || null;
    } catch (e) {
      return null;
    }
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.getRole();
    return role ? allowedRoles.includes(role) : false;
  }

  getName(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.nombre || null;
    } catch (e) { return null; }
  }

  getEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.sub || null;
    } catch (e) { return null; }
  }

  getUserId(): number {
    const token = this.getToken();
    if (!token) return 1;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id || 1;
    } catch (e) { return 1; }
  }

  getEmpresaId(): number {
    // Si el usuario seleccionó un tenant manualmente para la demo, usarlo
    const selected = localStorage.getItem('selected_empresa_id');
    if (selected) return parseInt(selected, 10);

    const token = this.getToken();
    if (!token) return 1; // Default Zara
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.empresa_id || 1;
    } catch (e) { return 1; }
  }

  setEmpresaId(empresaId: number) {
    localStorage.setItem('selected_empresa_id', empresaId.toString());
  }

  getEmpresaNombre(): string {
    const id = this.getEmpresaId();
    if (id === 2) return 'Urban Style SRL';
    return 'Zara Bolivia S.A.';
  }
}
