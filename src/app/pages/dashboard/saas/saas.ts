import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-saas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saas.html',
  styleUrls: ['./saas.css'],
})
export class SaasComponent implements OnInit {
  empresas: any[] = [];
  planes: any[] = [];
  error = '';
  message = '';
  platform = false;
  busy = false;
  api = environment.apiUrl;
  draft: any = {
    nombre: '',
    codigo: '',
    plan_id: 1,
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
  };
  constructor(
    private http: HttpClient,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {
    this.platform = auth.getRole() === 'AdministradorPlataforma';
  }
  ngOnInit() {
    this.load();
  }
  async load() {
    try {
      [this.empresas, this.planes] = await Promise.all(
        ['/saas/empresas', '/saas/planes'].map((p) =>
          firstValueFrom(this.http.get<any[]>(this.api + p)),
        ),
      );
      for (const e of this.empresas)
        e.limites = await firstValueFrom(
          this.http.get(this.api + '/saas/empresas/' + e.id + '/limites'),
        );
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudieron cargar las empresas';
    }
    this.cdr.detectChanges();
  }
  async create() {
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.http.post(this.api + '/saas/empresas', this.draft));
      this.draft.admin_password = '';
      this.message = 'Empresa y administrador creados';
      await this.load();
    } catch (e: any) {
      this.error =
        typeof e.error?.detail === 'string'
          ? e.error.detail
          : 'Revise los datos de la empresa y del administrador';
    } finally {
      this.busy = false;
      this.cdr.detectChanges();
    }
  }
  async toggle(e: any) {
    try {
      await firstValueFrom(
        this.http.put(this.api + '/saas/empresas/' + e.id, { activa: !e.activa }),
      );
      await this.load();
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudo actualizar';
      this.cdr.detectChanges();
    }
  }
  async plan(e: any) {
    try {
      await firstValueFrom(
        this.http.post(this.api + '/saas/suscripciones/asignar', {
          empresa_id: e.id,
          plan_id: Number(e.planElegido),
          dias_duracion: 365,
        }),
      );
      await this.load();
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudo asignar el plan';
      this.cdr.detectChanges();
    }
  }
}
