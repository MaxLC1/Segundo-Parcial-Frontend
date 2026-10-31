import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery.html',
  styleUrls: ['./delivery.css']
})
export class Delivery implements OnInit {
  deliveries: any[] = [];
  isLoading = true;
  isSaving = false;

  isAdmin = false;
  repartidores: any[] = [];

  constructor(private cdr: ChangeDetectorRef, private auth: Auth) {
    this.isAdmin = this.auth.getRole() === 'Administrador';
  }

  ngOnInit() {
    this.cargarDeliveries();
  }

  async cargarDeliveries() {
    this.isLoading = true;
    try {
      const token = localStorage.getItem('token');
      
      // 1. Obtener los recojos y entregas
      const res = await fetch(`${API_URL}/delivery/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error al cargar órdenes');
      const data = await res.json();
      
      // 2. Obtener los detalles de las devoluciones y ventas
      const resDevs = await fetch(`${API_URL}/devoluciones/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const devs = resDevs.ok ? await resDevs.json() : [];

      const resVentas = await fetch(`${API_URL}/ventas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ventas = resVentas.ok ? await resVentas.json() : [];

      const resUsuarios = await fetch(`${API_URL}/seguridad/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usuarios = resUsuarios.ok ? await resUsuarios.json() : [];
      
      if (this.isAdmin) {
        this.repartidores = usuarios.filter((u: any) => u.rol?.nombre === 'Repartidor');
      }

      this.deliveries = data.map((d: any) => {
        d.nuevoEstado = d.estado;
        d.nuevoRepartidorId = d.repartidor_id;
        if (d.repartidor_id) {
          d.repartidor = usuarios.find((u: any) => u.id === d.repartidor_id);
        }
        if (d.devolucion_id) {
          d.tipo = 'RECOJO';
          d.devolucion = devs.find((dev: any) => dev.id === d.devolucion_id);
        } else if (d.venta_id) {
          d.tipo = 'ENVÍO';
          d.venta = ventas.find((v: any) => v.id === d.venta_id);
        } else {
          d.tipo = 'DESCONOCIDO';
        }
        return d;
      });
    } catch (e) {
      console.error(e);
      alert('Error al cargar órdenes. Verifica tus permisos.');
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async actualizarEstado(d: any) {
    if (d.estado === d.nuevoEstado) return;
    
    this.isSaving = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/delivery/${d.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: d.nuevoEstado })
      });
      
      if (res.ok) {
        d.estado = d.nuevoEstado;
        // Si el estado es Asignado y es repartidor, la API backend autoasigna.
        // Recargamos silenciosamente para obtener el nombre del repartidor asignado.
        if (d.estado === 'Asignado' && !this.isAdmin) {
          this.cargarDeliveries();
        }
      } else {
        alert('Error al actualizar estado');
        d.nuevoEstado = d.estado; // rollback UI
      }
    } catch (e) {
      console.error(e);
      d.nuevoEstado = d.estado;
    }
    this.isSaving = false;
    this.cdr.detectChanges();
  }

  async asignarRepartidor(d: any) {
    if (d.repartidor_id === d.nuevoRepartidorId) return;
    
    this.isSaving = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/delivery/${d.id}/asignar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repartidor_id: d.nuevoRepartidorId })
      });
      
      if (res.ok) {
        this.cargarDeliveries(); // Recargar para actualizar UI completo
      } else {
        alert('Error al asignar repartidor');
        d.nuevoRepartidorId = d.repartidor_id; // rollback UI
      }
    } catch (e) {
      console.error(e);
      d.nuevoRepartidorId = d.repartidor_id;
    }
    this.isSaving = false;
    this.cdr.detectChanges();
  }

  getBadgeClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'pendiente';
      case 'asignado': return 'asignado';
      case 'en camino': return 'en-camino';
      case 'recogido': return 'recogido';
      case 'completado': return 'completado';
      default: return 'pendiente';
    }
  }
}
