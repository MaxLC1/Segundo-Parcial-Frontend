import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devoluciones.html',
  styleUrls: ['./devoluciones.css']
})
export class Devoluciones implements OnInit {
  tabActivo: 'devoluciones' | 'cambios' | 'notas' = 'notas';
  filtroNotas: 'TODAS' | 'EN_MARCHA' | 'COMPLETADA' = 'EN_MARCHA';
  
  devoluciones: any[] = [];
  repartidores: any[] = [];
  ventas: any[] = [];
  cambios: any[] = [];
  notas: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  
  isLoading = true;
  showModal = false;
  showCambioModal = false;
  showCrearNotaModal = false;
  showNotaDeliveryModal = false;
  notaSeleccionada: any = null;

  nuevaDev = { venta_id: '', motivo: '', tipo_solicitud: 'Devolución', requiere_delivery: false };
  
  nuevoCambio = {
    venta_id: '' as any,
    producto_anterior_id: '' as any,
    talla_anterior_id: '' as any,
    color_anterior_id: '' as any,
    producto_nuevo_id: '' as any,
    talla_nueva_id: '' as any,
    color_nueva_id: '' as any,
    motivo: '',
    diferencia_precio: 0
  };

  nuevaNota = {
    venta_id: '' as any,
    prenda_devuelta_info: '',
    prenda_nueva_info: '',
    precio_prenda_original: 100,
    precio_prenda_nueva: 150,
    motivo: 'Prenda no ajusta correctamente, cambio por prenda de catálogo',
    tipo_solicitud: 'Cambio por Mayor Valor'
  };

  cambioError: string = '';
  cambioSuccess: string = '';
  notaError: string = '';
  notaSuccess: string = '';

  constructor(private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }


  async cargarDatos() {
    this.isLoading = true;
    try {
      const token = this.auth.getToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const devRes = await fetch(`${API_URL}/devoluciones/`, { headers });
      this.devoluciones = await devRes.json();

      const usuRes = await fetch(`${API_URL}/seguridad/usuarios`, { headers });
      const usuarios = await usuRes.json();
      this.repartidores = usuarios.filter((u: any) => u.rol.nombre === 'Repartidor');

      const ventRes = await fetch(`${API_URL}/ventas/`, { headers });
      this.ventas = await ventRes.json();

      const prodRes = await fetch(`${API_URL}/catalogo/productos`, { headers });
      this.productos = await prodRes.json();

      const talRes = await fetch(`${API_URL}/catalogo/tallas`, { headers });
      this.tallas = await talRes.json();

      const colRes = await fetch(`${API_URL}/catalogo/colores`, { headers });
      this.colores = await colRes.json();

      await this.cargarCambios();
      await this.cargarNotas();
      
    } catch (e) {
      console.error(e);
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async cargarNotas() {
    try {
      const res = await fetch(`${API_URL}/devoluciones/notas`);
      if (res.ok) {
        this.notas = await res.json();
      }
    } catch (e) {
      console.error('Error cargando notas de devolución:', e);
    }
  }

  get notasFiltradas(): any[] {
    if (this.filtroNotas === 'TODAS') return this.notas;
    return this.notas.filter(n => n.estado === this.filtroNotas);
  }

  abrirNotaDelivery(nota: any) {
    this.notaSeleccionada = nota;
    this.showNotaDeliveryModal = true;
    this.cdr.detectChanges();
  }

  async crearNotaDevolucion() {
    this.notaError = '';
    this.notaSuccess = '';

    if (!this.nuevaNota.venta_id || !this.nuevaNota.prenda_devuelta_info || !this.nuevaNota.motivo) {
      this.notaError = 'Por favor complete todos los datos requeridos para la nota de devolución.';
      return;
    }

    try {
      const payload = {
        venta_id: parseInt(this.nuevaNota.venta_id),
        prenda_devuelta_info: this.nuevaNota.prenda_devuelta_info,
        prenda_nueva_info: this.nuevaNota.prenda_nueva_info || 'Devolución Directa',
        precio_prenda_original: parseFloat(this.nuevaNota.precio_prenda_original as any) || 0.0,
        precio_prenda_nueva: parseFloat(this.nuevaNota.precio_prenda_nueva as any) || 0.0,
        motivo: this.nuevaNota.motivo,
        tipo_solicitud: this.nuevaNota.tipo_solicitud,
        empresa_id: 1,
        usuario_id: 2
      };

      const res = await fetch(`${API_URL}/devoluciones/crear-nota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        this.notaError = data.detail || 'Error al emitir la nota de devolución.';
        this.cdr.detectChanges();
        return;
      }

      this.notaSuccess = `¡Nota ${data.codigo_nota} generada con éxito! Lista para presentar al delivery.`;
      await this.cargarNotas();
      setTimeout(() => {
        this.showCrearNotaModal = false;
        this.notaSuccess = '';
        this.cdr.detectChanges();
      }, 1500);

    } catch (e: any) {
      this.notaError = 'Error de conexión al generar la nota de devolución.';
      console.error(e);
    }
    this.cdr.detectChanges();
  }

  async completarNota(notaId: number) {
    if (!confirm('¿Confirma que la devolución ha sido completada por el delivery/tienda? Se eliminará de la vista del cliente y se archivará en el histórico del administrador.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/devoluciones/notas/${notaId}/completar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones: 'Completado por repartidor' })
      });

      if (res.ok) {
        await this.cargarNotas();
        if (this.showNotaDeliveryModal) {
          this.showNotaDeliveryModal = false;
        }
        alert('Nota completada y archivada en el histórico.');
      }
    } catch (e) {
      console.error(e);
    }
    this.cdr.detectChanges();
  }


  async cargarCambios() {
    try {
      const token = this.auth.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/ventas/cambios`, { headers });
      if (res.ok) {
        this.cambios = await res.json();
      }
    } catch (e) {
      console.error('Error cargando cambios:', e);
    }
  }

  async crearDevolucion() {
    if (!this.nuevaDev.venta_id || !this.nuevaDev.motivo) return;
    try {
      const token = this.auth.getToken();
      await fetch(`${API_URL}/devoluciones/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venta_id: parseInt(this.nuevaDev.venta_id), 
          motivo: this.nuevaDev.motivo,
          tipo_solicitud: this.nuevaDev.tipo_solicitud,
          requiere_delivery: this.nuevaDev.requiere_delivery ? 1 : 0
        })
      });
      this.showModal = false;
      this.nuevaDev = { venta_id: '', motivo: '', tipo_solicitud: 'Devolución', requiere_delivery: false };
      this.cargarDatos();
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }

  async registrarCambio() {
    this.cambioError = '';
    this.cambioSuccess = '';

    if (!this.nuevoCambio.venta_id || !this.nuevoCambio.producto_anterior_id || !this.nuevoCambio.producto_nuevo_id || !this.nuevoCambio.motivo) {
      this.cambioError = 'Por favor complete todos los campos obligatorios del cambio de prenda.';
      return;
    }

    try {
      const token = this.auth.getToken();
      const payload = {
        venta_id: parseInt(this.nuevoCambio.venta_id),
        producto_anterior_id: parseInt(this.nuevoCambio.producto_anterior_id),
        talla_anterior_id: parseInt(this.nuevoCambio.talla_anterior_id) || 1,
        color_anterior_id: parseInt(this.nuevoCambio.color_anterior_id) || 1,
        producto_nuevo_id: parseInt(this.nuevoCambio.producto_nuevo_id),
        talla_nueva_id: parseInt(this.nuevoCambio.talla_nueva_id) || 1,
        color_nueva_id: parseInt(this.nuevoCambio.color_nueva_id) || 1,
        motivo: this.nuevoCambio.motivo,
        diferencia_precio: parseFloat(this.nuevoCambio.diferencia_precio as any) || 0.0
      };

      const res = await fetch(`${API_URL}/ventas/cambios`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        this.cambioError = data.detail || 'No se pudo procesar el cambio de prenda.';
        this.cdr.detectChanges();
        return;
      }

      this.cambioSuccess = `¡Cambio #${data.id} registrado exitosamente! Inventario actualizado.`;
      await this.cargarCambios();
      setTimeout(() => {
        this.showCambioModal = false;
        this.cambioSuccess = '';
        this.nuevoCambio = {
          venta_id: '',
          producto_anterior_id: '',
          talla_anterior_id: '',
          color_anterior_id: '',
          producto_nuevo_id: '',
          talla_nueva_id: '',
          color_nueva_id: '',
          motivo: '',
          diferencia_precio: 0
        };
        this.cdr.detectChanges();
      }, 1500);

    } catch (e: any) {
      this.cambioError = 'Error de red al intentar registrar el cambio de prenda.';
      console.error(e);
    }
    this.cdr.detectChanges();
  }

  getProductoNombre(id: number): string {
    return this.productos.find(p => p.id === id)?.nombre || `Producto #${id}`;
  }

  getTallaNombre(id: number): string {
    return this.tallas.find(t => t.id === id)?.nombre || `Talla #${id}`;
  }

  getColorNombre(id: number): string {
    return this.colores.find(c => c.id === id)?.nombre || `Color #${id}`;
  }

  async asignarRepartidor(devId: number, event: any) {
    const repId = event.target.value;
    if (!repId) return;
    
    try {
      const token = this.auth.getToken();
      const res = await fetch(`${API_URL}/delivery/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ devolucion_id: devId })
      });
      const delivery = await res.json();
      
      await fetch(`${API_URL}/delivery/${delivery.id}/asignar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ repartidor_id: parseInt(repId) })
      });

      await fetch(`${API_URL}/devoluciones/${devId}/estado`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'En Proceso' })
      });
      
      alert('Repartidor asignado exitosamente');
      this.cargarDatos();
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }
}
