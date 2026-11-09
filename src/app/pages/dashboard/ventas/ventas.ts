import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { VentasService } from '../../../services/ventas';
import { OfflineStorageService } from '../../../services/offline-storage.service';
import { OfflineSyncService } from '../../../services/offline-sync.service';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css'],
})
export class Ventas implements OnInit {
  productos: any[] = [];
  sucursales: any[] = [];
  inventarios: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];

  cart: any[] = [];
  sucursalSeleccionada: number | null = null;
  productoSeleccionado: number | null = null;
  tallaSeleccionada: number | null = null;
  colorSeleccionado: number | null = null;
  cantidadSeleccionada: number = 1;

  isProcessing = false;
  ventaExitosa = false;
  mensajeOfflineVenta: string | null = null;

  cuponCodigo = '';
  clientes: any[] = [];
  clienteId: number | null = null;
  metodoPago: string = 'Efectivo';
  tipoEntrega: string = 'Recojo en Tienda';
  direccionEnvio: string = '';

  showModalQR: boolean = false;
  showModalStripe: boolean = false;

  mockCardNumber: string = '';
  mockCardExp: string = '';
  mockCardCvc: string = '';

  qrUrl: string = '';
  qrTxId: string = '';
  pollingInterval: any;
  paymentSuccessQR: boolean = false;
  paymentSuccessStripe: boolean = false;
  isVerifying: boolean = false;

  constructor(
    private ventasService: VentasService,
    private offlineStorage: OfflineStorageService,
    private offlineSync: OfflineSyncService,
    private auth: Auth,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadData();
    this.http.get<any[]>(environment.apiUrl + '/ventas/clientes').subscribe({
      next: (rows) => {
        this.clientes = rows;
        this.offlineStorage
          .obtenerReferencias()
          .then((refs) => this.offlineStorage.guardarReferencias({ ...refs, clientes: rows }));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  formatCardNumber(val: string) {
    let cleaned = val.replace(/\D/g, '');
    this.mockCardNumber = cleaned.match(/.{1,4}/g)?.join(' ') || '';
  }

  formatCardExp(val: string) {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      this.mockCardExp = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    } else {
      this.mockCardExp = cleaned;
    }
  }

  formatCardCvc(val: string) {
    this.mockCardCvc = val.replace(/\D/g, '').substring(0, 4);
  }

  async loadData() {
    const empresaId = this.auth.getEmpresaId();

    if (!navigator.onLine) {
      console.log('[POS Ventas] Sin conexión. Cargando catálogo desde IndexedDB local...');
      const prodsOffline = await this.offlineStorage.obtenerCatalogoOffline();
      if (prodsOffline.length > 0) {
        this.productos = prodsOffline;
      }
      await this.restoreChoices();
      this.cdr.detectChanges();
      return;
    }

    const apiUrl = environment.apiUrl;
    forkJoin({
      productos: this.http.get<any[]>(`${apiUrl}/catalogo/productos?empresa_id=${empresaId}`),
      tallas: this.http.get<any[]>(`${apiUrl}/catalogo/tallas`),
      colores: this.http.get<any[]>(`${apiUrl}/catalogo/colores`),
      sucursales: this.http.get<any[]>(`${apiUrl}/sucursales/sucursales?empresa_id=${empresaId}`),
      inventarios: this.http.get<any[]>(`${apiUrl}/sucursales/inventarios?empresa_id=${empresaId}`),
    }).subscribe({
      next: async (res) => {
        this.productos = res.productos;
        this.tallas = res.tallas;
        this.colores = res.colores;
        this.sucursales = res.sucursales;
        this.inventarios = res.inventarios;

        // Guardar copia local en IndexedDB para disponibilidad offline
        this.offlineStorage.guardarCatalogoOffline(res.productos);
        this.offlineStorage.guardarReferencias({
          ...(await this.offlineStorage.obtenerReferencias()),
          ...res,
        });

        if (this.sucursales.length > 0 && !this.sucursalSeleccionada) {
          this.sucursalSeleccionada = this.sucursales[0].id;
        }

        this.cdr.detectChanges();
      },
      error: async (err) => {
        console.warn('Error al cargar datos online, recuperando catálogo local de IndexedDB:', err);
        const prodsOffline = await this.offlineStorage.obtenerCatalogoOffline();
        if (prodsOffline.length > 0) {
          this.productos = prodsOffline;
        }
        await this.restoreChoices();
        this.cdr.detectChanges();
      },
    });
  }

  async restoreChoices() {
    const refs = await this.offlineStorage.obtenerReferencias();
    this.clientes = refs.clientes || [];
    this.tallas = refs.tallas || [];
    this.colores = refs.colores || [];
    this.sucursales = refs.sucursales || [];
    this.inventarios = refs.inventarios || [];
    if (this.sucursales.length) this.sucursalSeleccionada = this.sucursales[0].id;
  }
  getProductoNombre(id: number): string {
    return this.productos.find((p) => p.id === id)?.nombre || '';
  }
  getProductoPrecio(id: number): number {
    return this.productos.find((p) => p.id === id)?.precio || 0;
  }
  getTalla(id: number): string {
    return this.tallas.find((t) => t.id === id)?.nombre || '';
  }
  getColor(id: number): string {
    return this.colores.find((c) => c.id === id)?.nombre || '';
  }

  getStockDisponible(): number {
    if (
      !this.sucursalSeleccionada ||
      !this.productoSeleccionado ||
      !this.tallaSeleccionada ||
      !this.colorSeleccionado
    )
      return 0;

    const inv = this.inventarios.find(
      (i) =>
        i.sucursal_id === this.sucursalSeleccionada &&
        i.producto_id === this.productoSeleccionado &&
        i.talla_id === this.tallaSeleccionada &&
        i.color_id === this.colorSeleccionado,
    );
    // En modo offline si no hay inventario cargado, permitimos operar con stock local conocido
    return inv ? inv.cantidad : 0;
  }

  addToCart() {
    if (!this.productoSeleccionado || !this.tallaSeleccionada || !this.colorSeleccionado) return;

    const stock = this.getStockDisponible();
    if (this.cantidadSeleccionada <= 0 || this.cantidadSeleccionada > stock) {
      alert('No hay suficiente stock en esta sucursal');
      return;
    }

    const precio = this.getProductoPrecio(this.productoSeleccionado);
    const idx = this.cart.findIndex(
      (i) =>
        i.producto_id === this.productoSeleccionado &&
        i.talla_id === this.tallaSeleccionada &&
        i.color_id === this.colorSeleccionado,
    );

    if (idx >= 0) {
      this.cart[idx].cantidad += this.cantidadSeleccionada;
      this.cart[idx].subtotal = this.cart[idx].cantidad * precio;
    } else {
      this.cart.push({
        producto_id: this.productoSeleccionado,
        producto_nombre: this.getProductoNombre(this.productoSeleccionado),
        talla_id: this.tallaSeleccionada,
        color_id: this.colorSeleccionado,
        cantidad: this.cantidadSeleccionada,
        precio_unitario: precio,
        subtotal: precio * this.cantidadSeleccionada,
      });
    }

    this.productoSeleccionado = null;
    this.tallaSeleccionada = null;
    this.colorSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.cdr.detectChanges();
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    this.cdr.detectChanges();
  }

  getTotal(): number {
    return this.cart.reduce((acc, item) => acc + item.subtotal, 0);
  }

  procesarVenta() {
    if (this.cart.length === 0 || !this.sucursalSeleccionada) return;

    if (
      this.tipoEntrega === 'Delivery' &&
      (!this.direccionEnvio || this.direccionEnvio.trim() === '')
    ) {
      alert('Por favor ingrese la dirección de envío para el Delivery.');
      return;
    }

    // DESAFÍO IV / SECCIÓN 7.2: Operación Offline obligatoria de contado (Efectivo)
    if (!navigator.onLine) {
      this.registrarVentaOfflineLocal();
      return;
    }

    if (this.metodoPago === 'QR') {
      this.confirmarPagoQR();
      return;
    } else if (this.metodoPago === 'Stripe') {
      this.showModalStripe = true;
      this.cdr.detectChanges();
      return;
    }

    // Pago en Efectivo directo
    this.enviarVentaBackend('Efectivo', null);
  }

  async registrarVentaOfflineLocal() {
    if (this.metodoPago !== 'Efectivo' || this.cuponCodigo) {
      alert('Sin conexión solo se registra efectivo y el cupón debe validarse en línea.');
      return;
    }
    this.isProcessing = true;
    this.cdr.detectChanges();

    try {
      const sucursalObj = this.sucursales.find((s) => s.id === this.sucursalSeleccionada);
      const uuid = await this.offlineStorage.registrarVentaOffline({
        sucursal_id: this.sucursalSeleccionada!,
        sucursal_nombre: sucursalObj?.nombre || `Sucursal #${this.sucursalSeleccionada}`,
        usuario_id: this.clienteId || this.auth.getUserId(),
        empresa_id: this.auth.getEmpresaId(),
        metodo_pago: 'Efectivo',
        total: this.getTotal(),
        detalles: this.cart,
      });

      await this.offlineSync.actualizarContadorPendientes();

      this.isProcessing = false;
      this.ventaExitosa = true;
      this.mensajeOfflineVenta = `[MODO OFFLINE] Venta de contado registrada localmente con UUID: ${uuid}. Queda en cola de sincronización.`;
      this.cart = [];
      this.cdr.detectChanges();

      setTimeout(() => {
        this.ventaExitosa = false;
        this.mensajeOfflineVenta = null;
        this.cdr.detectChanges();
      }, 5000);
    } catch (e) {
      console.error('Error registrando venta offline:', e);
      alert('Error guardando la venta localmente en IndexedDB');
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  confirmarPagoQR() {
    this.isProcessing = true;
    this.cdr.detectChanges();

    const payload = { amount: this.getTotal() };
    this.http.post<any>(`${environment.apiUrl}/ventas/generar-qr`, payload).subscribe({
      next: async (res) => {
        this.qrUrl = res.qr_url;
        this.qrTxId = res.tx_id;
        this.showModalQR = true;
        this.paymentSuccessQR = false;
        this.isProcessing = false;
        this.cdr.detectChanges();

        this.pollingInterval = setInterval(() => {
          this.checkQRPaymentStatus();
        }, 2000);
      },
      error: (err) => {
        alert('Error al generar QR: ' + (err.error?.detail || err.message));
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
    });
  }

  checkQRPaymentStatus() {
    if (!this.qrTxId) return;
    this.http.get<any>(`${environment.apiUrl}/ventas/estado-pago-qr/${this.qrTxId}`).subscribe({
      next: async (res) => {
        if (res.status === 'COMPLETED') {
          clearInterval(this.pollingInterval);
          this.paymentSuccessQR = true;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.enviarVentaBackend('QR', this.qrTxId);
            this.showModalQR = false;
            this.qrTxId = '';
            this.qrUrl = '';
            this.paymentSuccessQR = false;
            this.isVerifying = false;
          }, 2000);
        }
      },
    });
  }

  simularEscaneoCliente() {
    if (!this.qrTxId) return;
    this.isVerifying = true;
    this.cdr.detectChanges();
    this.http
      .post<any>(`${environment.apiUrl}/ventas/simular-pago-cliente/${this.qrTxId}`, {})
      .subscribe();
  }

  cerrarModalQR() {
    this.showModalQR = false;
    this.isVerifying = false;
    this.paymentSuccessQR = false;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  confirmarPagoStripe() {
    if (!this.mockCardNumber || !this.mockCardExp || !this.mockCardCvc) {
      alert('Por favor ingrese los datos de la tarjeta.');
      return;
    }

    this.isProcessing = true;
    this.cdr.detectChanges();
    const payload = { amount: this.getTotal(), currency: 'bob' };

    this.http.post<any>(`${environment.apiUrl}/ventas/create-payment-intent`, payload).subscribe({
      next: async (res) => {
        const txId = res.client_secret;
        this.paymentSuccessStripe = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.enviarVentaBackend('Stripe', txId);
          this.showModalStripe = false;
          this.paymentSuccessStripe = false;
        }, 2000);
      },
      error: (err) => {
        alert('Error en la pasarela de pago: ' + (err.error?.detail || err.message));
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
    });
  }

  private enviarVentaBackend(metodo: string, transaccion_id: string | null) {
    this.isProcessing = true;
    this.cdr.detectChanges();

    const payload = {
      sucursal_id: this.sucursalSeleccionada,
      usuario_id: this.clienteId || this.auth.getUserId(),
      empresa_id: this.auth.getEmpresaId(),
      cupon_codigo: this.cuponCodigo || null,
      metodo_pago: metodo,
      transaccion_id: transaccion_id,
      tipo_entrega: this.tipoEntrega,
      direccion_envio: this.direccionEnvio,
      detalles: this.cart,
    };

    this.ventasService.crearVenta(payload).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        this.ventaExitosa = true;
        this.cart = [];
        this.mockCardNumber = '';
        this.mockCardExp = '';
        this.mockCardCvc = '';
        this.loadData();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.ventaExitosa = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.isProcessing = false;
        alert(
          err.error?.detail ||
            'No se pudo confirmar la venta. Compruebe su historial antes de reintentar.',
        );
        this.cdr.detectChanges();
      },
    });
  }
}
