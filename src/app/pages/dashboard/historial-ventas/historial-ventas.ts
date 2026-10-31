import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentasService } from '../../../services/ventas';
import { Catalogo } from '../../../services/catalogo';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-ventas.html',
  styleUrls: ['./historial-ventas.css']
})
export class HistorialVentas implements OnInit {
  ventas: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  sucursales: any[] = [];
  usuarios: any[] = []; // Opcional, si queremos mostrar el nombre del usuario
  isLoading = true;

  constructor(
    private ventasService: VentasService,
    private catalogoService: Catalogo,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMetadata();
  }

  loadMetadata() {
    // Para no hacer el backend muy complejo, resolveremos los IDs a Nombres en el Frontend
    this.catalogoService.getProductos().subscribe(res => { this.productos = res; this.checkLoading(); });
    this.catalogoService.getTallas().subscribe(res => { this.tallas = res; this.checkLoading(); });
    this.catalogoService.getColores().subscribe(res => { this.colores = res; this.checkLoading(); });
    this.http.get<any[]>(`${environment.apiUrl}/sucursales/sucursales`).subscribe(res => { this.sucursales = res; this.checkLoading(); });
    this.http.get<any[]>(`${environment.apiUrl}/seguridad/usuarios`).subscribe(res => { this.usuarios = res; this.checkLoading(); });
    this.ventasService.getVentas().subscribe(res => { this.ventas = res; this.checkLoading(); });
  }

  checkLoading() {
    if (this.productos.length > 0 && this.ventas.length >= 0) { // ventas >= 0 porque puede estar vacio
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getProductoNombre(id: number): string { return this.productos.find(p => p.id === id)?.nombre || 'Desconocido'; }
  getTallaNombre(id: number): string { return this.tallas.find(t => t.id === id)?.nombre || ''; }
  getColorNombre(id: number): string { return this.colores.find(c => c.id === id)?.nombre || ''; }
  getSucursalNombre(id: number): string { return this.sucursales.find(s => s.id === id)?.nombre || 'Sucursal'; }
  getUsuarioNombre(id: number): string { return this.usuarios.find(u => u.id === id)?.nombre_completo || 'Cliente #' + id; }

  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-BO', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}

