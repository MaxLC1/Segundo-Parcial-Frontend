import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventoBitacora {
  id: number;
  fecha: string;
  usuario_id?: number;
  usuario_email?: string;
  usuario_nombre?: string;
  rol?: string;
  empresa_id?: number;
  empresa_nombre?: string;
  ip?: string;
  accion: string;
  modulo: string;
  detalle?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BitacoraService {
  private apiUrl = `${environment.apiUrl}/bitacora`;

  constructor(private http: HttpClient) {}

  getEventos(filtros: {
    empresa_id?: number;
    usuario_email?: string;
    modulo?: string;
    accion?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
    offset?: number;
  } = {}): Observable<EventoBitacora[]> {
    let params = new HttpParams();
    if (filtros.empresa_id) params = params.set('empresa_id', filtros.empresa_id.toString());
    if (filtros.usuario_email) params = params.set('usuario_email', filtros.usuario_email);
    if (filtros.modulo) params = params.set('modulo', filtros.modulo);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.offset) params = params.set('offset', filtros.offset.toString());

    return this.http.get<EventoBitacora[]>(`${this.apiUrl}/eventos`, { params });
  }

  getModulos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/modulos`);
  }
}

