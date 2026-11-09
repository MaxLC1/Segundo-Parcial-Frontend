import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BitacoraService, EventoBitacora } from '../../../services/bitacora.service';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora.html',
  styleUrls: ['./bitacora.css'],
})
export class BitacoraComponent implements OnInit {
  eventos: EventoBitacora[] = [];
  modulos: string[] = [];
  cargando = false;
  error = '';
  isPlatformAdmin = false;

  filtroModulo = '';
  filtroAccion = '';
  filtroEmail = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  constructor(
    private bitacoraService: BitacoraService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {
    this.isPlatformAdmin = this.auth.getRole() === 'AdministradorPlataforma';
  }

  ngOnInit() {
    this.cargarModulos();
    this.cargarEventos();
  }

  cargarModulos() {
    this.bitacoraService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  cargarEventos() {
    this.cargando = true;
    this.error = '';

    const filtros: any = {
      limit: 300,
    };
    if (this.filtroModulo) filtros.modulo = this.filtroModulo;
    if (this.filtroAccion) filtros.accion = this.filtroAccion;
    if (this.filtroEmail) filtros.usuario_email = this.filtroEmail;
    if (this.filtroFechaDesde) filtros.fecha_desde = this.filtroFechaDesde;
    if (this.filtroFechaHasta) filtros.fecha_hasta = this.filtroFechaHasta;

    this.bitacoraService.getEventos(filtros).subscribe({
      next: (data) => {
        this.eventos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al cargar la bitácora';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  limpiarFiltros() {
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.filtroEmail = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.cargarEventos();
  }
}

