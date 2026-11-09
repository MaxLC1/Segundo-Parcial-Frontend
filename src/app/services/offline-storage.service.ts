import { Injectable } from '@angular/core';

export interface VentaOffline {
  operacion_uuid: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  usuario_id: number;
  empresa_id?: number;
  metodo_pago: string;
  total: number;
  fecha: string;
  estado: 'REGISTRADA_LOCAL' | 'ENVIADA' | 'CONFIRMADA' | 'RECHAZADA_CONFLICTO';
  motivo_rechazo?: string;
  detalles: Array<{
    producto_id: number;
    producto_nombre?: string;
    talla_id: number;
    color_id: number;
    cantidad: number;
    precio_unitario: number;
  }>;
}

export interface ReservaOffline {
  operacion_uuid: string;
  sucursal_id: number;
  sucursal_nombre?: string;
  usuario_id: number;
  empresa_id?: number;
  fecha: string;
  estado: 'REGISTRADA_LOCAL' | 'ENVIADA' | 'CONFIRMADA' | 'RECHAZADA_CONFLICTO';
  motivo_rechazo?: string;
  detalles: Array<{
    producto_id: number;
    producto_nombre?: string;
    talla_id: number;
    color_id: number;
    cantidad: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private scope(): string {
    try {
      const token = localStorage.getItem('token');
      const p = JSON.parse(atob((token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return `${p.empresa_id}_${p.id}`;
    } catch {
      return 'public';
    }
  }
  private activeScope = this.scope();
  private dbName = 'FashionStoreOfflineDB_' + this.activeScope;
  private dbVersion = 2;
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbInitPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('referencias')) db.createObjectStore('referencias');
        // 1. Catálogo Offline
        if (!db.objectStoreNames.contains('catalogo')) {
          db.createObjectStore('catalogo', { keyPath: 'id' });
        }

        // 2. Ventas Offline
        if (!db.objectStoreNames.contains('ventas')) {
          const storeVentas = db.createObjectStore('ventas', { keyPath: 'operacion_uuid' });
          storeVentas.createIndex('estado', 'estado', { unique: false });
          storeVentas.createIndex('fecha', 'fecha', { unique: false });
        }

        // 3. Reservas Offline
        if (!db.objectStoreNames.contains('reservas')) {
          const storeReservas = db.createObjectStore('reservas', { keyPath: 'operacion_uuid' });
          storeReservas.createIndex('estado', 'estado', { unique: false });
          storeReservas.createIndex('fecha', 'fecha', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        console.error('[IndexedDB] Error al abrir base de datos local:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.activeScope !== this.scope()) {
      this.db?.close();
      this.db = null;
      this.activeScope = this.scope();
      this.dbName = 'FashionStoreOfflineDB_' + this.activeScope;
      this.dbInitPromise = this.initDB();
    }
    if (this.db) return this.db;
    return this.dbInitPromise;
  }

  // Generador UUID v4 nativo
  generarUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // =========================================================================
  // CATÁLOGO OFFLINE (Consultas sin conexión)
  // =========================================================================

  async guardarCatalogoOffline(productos: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('catalogo', 'readwrite');
      const store = tx.objectStore('catalogo');

      // Limpiar y reemplazar con la versión más reciente
      store.clear();
      for (const prod of productos) {
        store.put(prod);
      }

      // Guardar timestamp de última descarga
      localStorage.setItem('catalogo_ultima_descarga_' + this.scope(), new Date().toISOString());

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async obtenerCatalogoOffline(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('catalogo', 'readonly');
      const store = tx.objectStore('catalogo');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  getUltimaDescargaCatalogo(): string | null {
    return localStorage.getItem('catalogo_ultima_descarga_' + this.scope());
  }

  // =========================================================================
  // VENTAS OFFLINE (Registro local y cola de sincronización)
  // =========================================================================

  async registrarVentaOffline(
    venta: Omit<VentaOffline, 'operacion_uuid' | 'estado' | 'fecha'>,
  ): Promise<string> {
    const db = await this.getDB();
    const uuid = this.generarUUID();
    const ventaCompleta: VentaOffline = {
      ...venta,
      operacion_uuid: uuid,
      estado: 'REGISTRADA_LOCAL',
      fecha: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('ventas', 'readwrite');
      const store = tx.objectStore('ventas');
      const request = store.add(ventaCompleta);

      tx.oncomplete = () => resolve(uuid);
      tx.onabort = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerTodasLasVentasOffline(): Promise<VentaOffline[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('ventas', 'readonly');
      const store = tx.objectStore('ventas');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarEstadoVenta(
    uuid: string,
    estado: VentaOffline['estado'],
    motivoRechazo?: string,
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('ventas', 'readwrite');
      const store = tx.objectStore('ventas');
      const getReq = store.get(uuid);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.estado = estado;
          if (motivoRechazo) item.motivo_rechazo = motivoRechazo;
          store.put(item);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // =========================================================================
  // RESERVAS OFFLINE
  // =========================================================================

  async registrarReservaOffline(
    reserva: Omit<ReservaOffline, 'operacion_uuid' | 'estado' | 'fecha'>,
  ): Promise<string> {
    const db = await this.getDB();
    const uuid = this.generarUUID();
    const reservaCompleta: ReservaOffline = {
      ...reserva,
      operacion_uuid: uuid,
      estado: 'REGISTRADA_LOCAL',
      fecha: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('reservas', 'readwrite');
      const store = tx.objectStore('reservas');
      const request = store.add(reservaCompleta);

      tx.oncomplete = () => resolve(uuid);
      tx.onabort = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerTodasLasReservasOffline(): Promise<ReservaOffline[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reservas', 'readonly');
      const store = tx.objectStore('reservas');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarEstadoReserva(
    uuid: string,
    estado: ReservaOffline['estado'],
    motivoRechazo?: string,
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reservas', 'readwrite');
      const store = tx.objectStore('reservas');
      const getReq = store.get(uuid);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.estado = estado;
          if (motivoRechazo) item.motivo_rechazo = motivoRechazo;
          store.put(item);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async obtenerOperacionesPendientes(): Promise<{
    ventas: VentaOffline[];
    reservas: ReservaOffline[];
  }> {
    const ventas = await this.obtenerTodasLasVentasOffline();
    const reservas = await this.obtenerTodasLasReservasOffline();

    const ventasPendientes = ventas.filter(
      (v) => v.estado === 'REGISTRADA_LOCAL' || v.estado === 'ENVIADA',
    );
    const reservasPendientes = reservas.filter(
      (r) => r.estado === 'REGISTRADA_LOCAL' || r.estado === 'ENVIADA',
    );

    return { ventas: ventasPendientes, reservas: reservasPendientes };
  }
  async guardarReferencias(data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('referencias', 'readwrite');
      tx.objectStore('referencias').put(data, 'operacion');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  }
  async obtenerReferencias(): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const q = db.transaction('referencias').objectStore('referencias').get('operacion');
      q.onsuccess = () => resolve(q.result || {});
      q.onerror = () => reject(q.error);
    });
  }
}
