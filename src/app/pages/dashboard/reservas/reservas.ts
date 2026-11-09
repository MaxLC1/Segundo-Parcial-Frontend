import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../services/auth';
import { OfflineStorageService } from '../../../services/offline-storage.service';
import { OfflineSyncService } from '../../../services/offline-sync.service';
import { ReservasService } from '../../../services/reservas';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class Reservas implements OnInit {
  reservas: any[] = [];
  clientes: any[] = [];
  sucursales: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  showCreate = false;
  createError = '';
  saving = false;
  draft: any = {
    usuario_id: null,
    sucursal_id: null,
    detalles: [{ producto_id: null, talla_id: null, color_id: null, cantidad: 1 }],
  };
  async loadChoices() {
    if (!navigator.onLine) {
      const refs = await this.storage.obtenerReferencias();
      this.clientes = refs.clientes || [];
      this.sucursales = refs.sucursales || [];
      this.productos = refs.productos || [];
      this.tallas = refs.tallas || [];
      this.colores = refs.colores || [];
      this.cdr.detectChanges();
      return;
    }
    try {
      [this.clientes, this.sucursales, this.productos, this.tallas, this.colores] =
        await Promise.all(
          [
            '/ventas/clientes',
            '/sucursales/sucursales',
            '/catalogo/productos',
            '/catalogo/tallas',
            '/catalogo/colores',
          ].map((p) => firstValueFrom(this.http.get<any[]>(environment.apiUrl + p))),
        );
      await this.storage.guardarReferencias({
        ...(await this.storage.obtenerReferencias()),
        clientes: this.clientes,
        sucursales: this.sucursales,
        productos: this.productos,
        tallas: this.tallas,
        colores: this.colores,
      });
    } catch {
      this.createError = 'No se pudieron cargar las opciones';
    }
    this.cdr.detectChanges();
  }
  addLine() {
    this.draft.detalles.push({ producto_id: null, talla_id: null, color_id: null, cantidad: 1 });
  }
  clienteNombre(id: number) {
    return this.clientes.find(c => c.id === id)?.nombre_completo || `Cliente #${id}`;
  }
  cantidadPrendas(reserva: any) {
    return (reserva.detalles || []).reduce((sum: number, d: any) => sum + d.cantidad, 0);
  }
  async create() {
    this.saving = true;
    this.createError = '';
    try {
      const data = { ...this.draft, empresa_id: this.auth.getEmpresaId() };
      if (!navigator.onLine) {
        await this.storage.registrarReservaOffline(data);
        await this.sync.actualizarContadorPendientes();
        this.mostrarNotificacion('Reserva guardada localmente, pendiente de confirmar');
      } else {
        await firstValueFrom(this.reservasService.crearReserva(data));
        this.loadReservas();
      }
      this.showCreate = false;
    } catch (e: any) {
      this.createError =
        typeof e.error?.detail === 'string' ? e.error.detail : 'No se pudo registrar la reserva';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  isLoading = false;

  notificationMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private auth: Auth,
    private storage: OfflineStorageService,
    private sync: OfflineSyncService,
  ) {}

  ngOnInit() {
    this.loadReservas();
    this.loadChoices();
  }

  loadReservas() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.reservasService.getReservas().subscribe({
      next: (data) => {
        this.reservas = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando reservas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cambiarEstado(reserva: any, nuevoEstado: string) {
    if (confirm(`¿Cambiar estado de la reserva #${reserva.id} a ${nuevoEstado}?`)) {
      this.reservasService.cambiarEstado(reserva.id, nuevoEstado).subscribe({
        next: () => {
          this.loadReservas();
          this.mostrarNotificacion(`Reserva actualizada a ${nuevoEstado}.`);
        },
        error: (err) => {
          console.error('Error actualizando estado:', err);
        },
      });
    }
  }

  mostrarNotificacion(mensaje: string) {
    this.notificationMessage = mensaje;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.notificationMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'badge text-warning';
      case 'Preparada':
        return 'badge text-primary';
      case 'Completada':
        return 'badge text-success';
      case 'Cancelada':
        return 'badge text-error';
      default:
        return 'badge text-muted';
    }
  }
}
