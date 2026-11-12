import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../services/cart';

import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shop.html',
  styleUrls: ['./shop.css'],
})
export class Shop implements OnInit {
  operationUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
  isCartOpen = false;
  isCheckoutOpen = false;
  cartItems: CartItem[] = [];

  sucursales: any[] = [];
  sucursalSeleccionada: number | null = null;
  misNotasActivas: any[] = [];
  showModalNotaCliente = false;
  notaClienteSeleccionada: any = null;
  isProcessing = false;
  correoCliente: string = '';

  // Pasarela de Pagos Digital con OTP
  showModalOTP = false;
  otpTransaccionId = '';
  otpCodigoSimulado = '';
  otpInput = '';
  otpMensaje = '';
  otpError = '';
  otpVerificando = false;
  tokenAutorizacionOTP: string | null = null;

  constructor(
    public cartService: CartService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    private router: Router,
  ) {
    this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
      try {
        this.cdr.markForCheck();
      } catch (e) {}
    });
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/sucursales/sucursales`).subscribe((res) => {
      this.sucursales = res;
    });
    this.cargarMisNotasActivas();
  }

  cargarMisNotasActivas() {
    if (!this.auth.isAuthenticated() || this.auth.getRole() !== 'Cliente') return;
    this.http.get<any[]>(`${environment.apiUrl}/cliente/notas`).subscribe({
      next: (notas) => {
        this.misNotasActivas = notas;
        this.cdr.detectChanges();
      },
      error: (e) => console.log('Sin notas activas de devolución', e),
    });
  }

  abrirMiNotaActiva(nota: any) {
    this.notaClienteSeleccionada = nota;
    this.showModalNotaCliente = true;
    this.cdr.detectChanges();
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  openCheckout() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.correoCliente = this.auth.getEmail() || '';
    this.isCartOpen = false;
    this.isCheckoutOpen = true;
  }

  tipoEntrega: string = 'Recojo en Tienda';
  direccionEnvio: string = '';
  metodoPagoGlobal: string = 'Caja';
  numeroTarjeta: string = '';

  onTarjetaNativeInput(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = input !== '' ? input.match(/.{1,4}/g)!.join(' ') : '';
    event.target.value = formatted;
    this.numeroTarjeta = formatted;
  }

  onTipoEntregaChange() {
    this.metodoPagoGlobal = this.tipoEntrega === 'Recojo en Tienda' ? 'Caja' : 'Efectivo';
  }

  onMetodoPagoChange() {}

  confirmarPedido() {
    if (!this.correoCliente) {
      alert('Por favor completa los datos requeridos.');
      return;
    }

    if (!this.sucursalSeleccionada) {
      alert('Debes seleccionar una sucursal para el recojo.');
      return;
    }
    if (
      this.tipoEntrega === 'Delivery' &&
      (!this.direccionEnvio || this.direccionEnvio.trim() === '')
    ) {
      alert('Debes ingresar una dirección para el envío.');
      return;
    }

    // Si el pago es digital (Tarjeta o QR), invocamos la Pasarela con OTP obligatorio
    if (this.metodoPagoGlobal === 'Tarjeta' || this.metodoPagoGlobal === 'QR') {
      this.iniciarPasarelaOTP();
      return;
    }

    // Si es en Caja o Efectivo, se procesa directamente
    this.ejecutarProcesamientoPedido();
  }

  iniciarPasarelaOTP() {
    this.isProcessing = true;
    this.otpError = '';
    this.otpInput = '';

    const payload = {
      monto: this.cartService.getTotal(),
      metodo: this.metodoPagoGlobal,
      cliente_email: this.correoCliente,
      cliente_telefono: '+591 78012345',
      empresa_id: this.auth.getEmpresaId(),
    };

    this.http.post<any>(`${environment.apiUrl}/pagos/iniciar-pasarela`, payload).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.otpTransaccionId = res.transaccion_id;
        this.otpCodigoSimulado = res.otp_simulado;
        this.otpMensaje = res.mensaje;
        this.showModalOTP = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isProcessing = false;
        this.manejarError(err);
      },
    });
  }

  validarCodigoOTP() {
    if (!this.otpInput || this.otpInput.trim().length !== 6) {
      this.otpError = 'Por favor ingresa el código OTP de 6 dígitos numéricos.';
      return;
    }

    this.otpVerificando = true;
    this.otpError = '';

    const payload = {
      transaccion_id: this.otpTransaccionId,
      codigo_otp: this.otpInput.trim(),
    };

    this.http.post<any>(`${environment.apiUrl}/pagos/validar-otp`, payload).subscribe({
      next: (res) => {
        this.otpVerificando = false;
        if (res.valido) {
          this.tokenAutorizacionOTP = res.token_autorizacion;
          this.showModalOTP = false;
          // Pago bancario autorizado: procedemos a registrar la venta
          this.ejecutarProcesamientoPedido();
        } else {
          this.otpError = res.mensaje || 'Código OTP inválido.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.otpVerificando = false;
        this.otpError = err.error?.detail || 'Error al validar el código OTP.';
        this.cdr.detectChanges();
      },
    });
  }

  ejecutarProcesamientoPedido() {
    this.isProcessing = true;
    this.cdr.detectChanges();

    // Si pagan presencial y es recojo, es una Reserva
    if (this.tipoEntrega === 'Recojo en Tienda' && this.metodoPagoGlobal === 'Caja') {
      const payload = {
        usuario_id: this.auth.getUserId(),
        operacion_uuid: this.operationUuid,
        sucursal_id: this.sucursalSeleccionada,
        estado: 'Pendiente',
        detalles: this.cartItems.map((item) => ({
          producto_id: item.producto.id,
          talla_id: item.talla_id || 1,
          color_id: item.color_id || 1,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_oferta || item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

      this.http.post(`${environment.apiUrl}/reservas/`, payload).subscribe({
        next: () => {
          this.finalizarProceso(
            '¡Reserva completada con éxito! Te esperamos en caja para realizar el pago.',
          );
        },
        error: (err) => {
          this.manejarError(err);
        },
      });
    } else {
      // Venta confirmada con o sin token de autorización OTP
      const payload = {
        sucursal_id: this.sucursalSeleccionada,
        usuario_id: this.auth.getUserId(),
        operacion_uuid: this.operationUuid,
        metodo_pago: this.metodoPagoGlobal,
        transaccion_id:
          this.tokenAutorizacionOTP ||
          (this.metodoPagoGlobal !== 'Efectivo'
            ? 'TXN-' + Math.floor(Math.random() * 1000000)
            : null),
        tipo_entrega: this.tipoEntrega,
        direccion_envio:
          this.tipoEntrega === 'Delivery' ? this.direccionEnvio : 'Retiro en Tienda Pagado',
        detalles: this.cartItems.map((item) => ({
          producto_id: item.producto.id,
          talla_id: item.talla_id || 1,
          color_id: item.color_id || 1,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_oferta || item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

      this.http.post(`${environment.apiUrl}/ventas/`, payload).subscribe({
        next: () => {
          if (this.tipoEntrega === 'Delivery') {
            this.finalizarProceso('¡Pago OTP exitoso! Tu orden está en camino con delivery.');
          } else {
            this.finalizarProceso(
              '¡Pago online validado con OTP! Tus prendas te esperan listas en la sucursal.',
            );
          }
        },
        error: (err) => {
          this.manejarError(err);
        },
      });
    }
  }

  isSuccess: boolean = false;
  successMessage: string = '';

  fechaExpiracion: string = '';

  onFechaNativeInput(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    event.target.value = input;
    this.fechaExpiracion = input;
  }

  finalizarProceso(mensaje: string) {
    this.isProcessing = false;
    this.cartService.clearCart();
    this.operationUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
    this.successMessage = mensaje;
    this.isSuccess = true;
    this.cdr.detectChanges();
  }

  closeCheckout() {
    this.isCheckoutOpen = false;
    setTimeout(() => {
      this.isSuccess = false;
      this.cdr.detectChanges();
    }, 500); // reset after closing
  }

  manejarError(err: any) {
    this.isProcessing = false;
    this.cdr.detectChanges();
    console.error(err);
    alert('Hubo un error al procesar tu solicitud: ' + (err.error?.detail || err.message));
  }

  removeFromCart(index: number) {
    this.cartService.removeFromCart(index);
  }
}
