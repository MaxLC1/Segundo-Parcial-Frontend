import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { OfflineSyncService } from '../../services/offline-sync.service';
import { OfflineStorageService, VentaOffline, ReservaOffline } from '../../services/offline-storage.service';
import { SaasService } from '../../services/saas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  userRole: string | null = '';
  userName: string | null = '';
  empresaNombre: string = '';
  empresaId: number = 1;
  empresasDisponibles: any[] = [];

  // Estado Offline & PWA
  isOnline: boolean = true;
  pendientesCount: number = 0;
  isSyncing: boolean = false;
  modalOperacionesVisible: boolean = false;
  ventasOffline: VentaOffline[] = [];
  reservasOffline: ReservaOffline[] = [];
  mensajeSyncToast: string | null = null;

  constructor(
    private router: Router,
    private auth: Auth,
    public offlineSync: OfflineSyncService,
    private offlineStorage: OfflineStorageService,
    private saasService: SaasService,
    private cdr: ChangeDetectorRef
  ) {
    this.userRole = this.auth.getRole();
    this.userName = this.auth.getName();
    this.empresaId = this.auth.getEmpresaId();
    this.empresaNombre = this.auth.getEmpresaNombre();
  }

  ngOnInit() {
    this.offlineSync.isOnline$.subscribe(online => {
      this.isOnline = online;
      this.cdr.detectChanges();
    });

    this.offlineSync.pendientesCount$.subscribe(count => {
      this.pendientesCount = count;
      this.cdr.detectChanges();
    });

    this.offlineSync.sincronizando$.subscribe(syncing => {
      this.isSyncing = syncing;
      this.cdr.detectChanges();
    });

    if (this.userRole === 'AdministradorPlataforma') {
      this.saasService.getEmpresas().subscribe({
        next: (list) => {
          this.empresasDisponibles = list;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  async sincronizarAhora() {
    this.mensajeSyncToast = 'Iniciando sincronización con el servidor central...';
    const res = await this.offlineSync.sincronizarTodo();
    this.mensajeSyncToast = res.mensaje;
    await this.cargarOperacionesOffline();
    this.cdr.detectChanges();
    setTimeout(() => { this.mensajeSyncToast = null; this.cdr.detectChanges(); }, 6000);
  }

  async abrirModalOperaciones() {
    await this.cargarOperacionesOffline();
    this.modalOperacionesVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalOperaciones() {
    this.modalOperacionesVisible = false;
  }

  async cargarOperacionesOffline() {
    this.ventasOffline = await this.offlineStorage.obtenerTodasLasVentasOffline();
    this.reservasOffline = await this.offlineStorage.obtenerTodasLasReservasOffline();
  }

  cambiarTenant(nuevoId: number) {
    this.empresaId = Number(nuevoId);
    this.auth.setEmpresaId(this.empresaId);
    this.empresaNombre = this.auth.getEmpresaNombre();
    // Recargar la vista actual para aplicar el nuevo tenant
    window.location.reload();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('selected_empresa_id');
    this.router.navigate(['/login']);
  }
}
