import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OfflineStorageService, VentaOffline, ReservaOffline } from './offline-storage.service';

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  private apiUrl = environment.apiUrl;

  public isOnline$ = new BehaviorSubject<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  public pendientesCount$ = new BehaviorSubject<number>(0);
  public sincronizando$ = new BehaviorSubject<boolean>(false);
  public ultimoResultadoSincronizacion$ = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
    private storage: OfflineStorageService,
  ) {
    this.initNetworkListeners();
    this.actualizarContadorPendientes();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log(
          '[OfflineSync] Conexión a Internet restablecida. Iniciando sincronización automática...',
        );
        this.isOnline$.next(true);
        this.sincronizarTodo();
      });

      window.addEventListener('offline', () => {
        console.log('[OfflineSync] Conexión perdida. Cambiando a Modo Offline...');
        this.isOnline$.next(false);
      });
    }
  }

  async actualizarContadorPendientes() {
    try {
      const { ventas, reservas } = await this.storage.obtenerOperacionesPendientes();
      this.pendientesCount$.next(ventas.length + reservas.length);
    } catch (e) {
      console.error('[OfflineSync] Error al actualizar contador de pendientes:', e);
    }
  }

  async sincronizarTodo(): Promise<{ exito: boolean; mensaje: string; resumen?: any }> {
    if (!navigator.onLine) {
      return { exito: false, mensaje: 'No hay conexión a Internet disponible para sincronizar.' };
    }

    if (this.sincronizando$.value) {
      return { exito: false, mensaje: 'Ya hay un proceso de sincronización en curso.' };
    }

    this.sincronizando$.next(true);

    try {
      const { ventas, reservas } = await this.storage.obtenerOperacionesPendientes();

      if (ventas.length === 0 && reservas.length === 0) {
        this.sincronizando$.next(false);
        return { exito: true, mensaje: 'No hay operaciones pendientes de sincronizar.' };
      }

      console.log(
        `[OfflineSync] Sincronizando ${ventas.length} ventas y ${reservas.length} reservas...`,
      );

      let ventasConfirmadas = 0;
      let ventasRechazadas = 0;
      let reservasConfirmadas = 0;

      // 1. Sincronizar Ventas
      if (ventas.length > 0) {
        const payloadVentas = {
          ventas: ventas.map((v) => ({
            sucursal_id: v.sucursal_id,
            usuario_id: v.usuario_id,
            empresa_id: v.empresa_id,
            metodo_pago: v.metodo_pago,
            operacion_uuid: v.operacion_uuid,
            origen: 'PWA_OFFLINE',
            fecha: v.fecha,
            detalles: v.detalles.map((d) => ({
              producto_id: d.producto_id,
              talla_id: d.talla_id,
              color_id: d.color_id,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
            })),
          })),
        };

        const resVentas: any = await firstValueFrom(
          this.http.post(`${this.apiUrl}/ventas/sincronizar-offline`, payloadVentas),
        );

        ventasConfirmadas = resVentas.confirmadas;
        ventasRechazadas = resVentas.rechazadas;

        for (const item of resVentas.resultados) {
          if (item.estado === 'CONFIRMADA') {
            await this.storage.actualizarEstadoVenta(item.operacion_uuid, 'CONFIRMADA');
          } else if (item.estado === 'RECHAZADA_CONFLICTO') {
            await this.storage.actualizarEstadoVenta(
              item.operacion_uuid,
              'RECHAZADA_CONFLICTO',
              item.mensaje,
            );
          }
        }
      }

      // 2. Sincronizar Reservas
      if (reservas.length > 0) {
        const payloadReservas = {
          reservas: reservas.map((r) => ({
            usuario_id: r.usuario_id,
            sucursal_id: r.sucursal_id,
            empresa_id: r.empresa_id,
            operacion_uuid: r.operacion_uuid,
            origen: 'PWA_OFFLINE',
            detalles: r.detalles.map((d) => ({
              producto_id: d.producto_id,
              talla_id: d.talla_id,
              color_id: d.color_id,
              cantidad: d.cantidad,
            })),
          })),
        };

        const resReservas: any = await firstValueFrom(
          this.http.post(`${this.apiUrl}/reservas/sincronizar-offline`, payloadReservas),
        );

        reservasConfirmadas = resReservas.confirmadas;

        for (const item of resReservas.resultados) {
          if (item.estado === 'CONFIRMADA') {
            await this.storage.actualizarEstadoReserva(item.operacion_uuid, 'CONFIRMADA');
          } else if (item.estado === 'RECHAZADA_CONFLICTO') {
            await this.storage.actualizarEstadoReserva(
              item.operacion_uuid,
              'RECHAZADA_CONFLICTO',
              item.mensaje,
            );
          }
        }
      }

      await this.actualizarContadorPendientes();

      const resumen = {
        ventas_confirmadas: ventasConfirmadas,
        ventas_rechazadas_conflicto: ventasRechazadas,
        reservas_confirmadas: reservasConfirmadas,
        fecha: new Date().toLocaleTimeString(),
      };
      this.ultimoResultadoSincronizacion$.next(resumen);

      const msg = `Sincronización finalizada: ${ventasConfirmadas} ventas confirmadas, ${ventasRechazadas} en conflicto, ${reservasConfirmadas} reservas confirmadas.`;
      return { exito: true, mensaje: msg, resumen };
    } catch (error: any) {
      console.error('[OfflineSync] Error durante la sincronización:', error);
      return {
        exito: false,
        mensaje: 'Error al comunicarse con el servidor durante la sincronización.',
      };
    } finally {
      this.sincronizando$.next(false);
    }
  }
}
