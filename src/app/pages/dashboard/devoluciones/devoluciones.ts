import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';
import { ReturnForm } from '../../../services/return-form';
@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReturnForm],
  templateUrl: './devoluciones.html',
  styles: [
    `
      .card {
        padding: 24px;
        margin-bottom: 20px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
      }
      .policy {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }
      .policy label {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      input,
      select {
        padding: 8px;
      }
      td,
      th {
        padding: 12px;
        text-align: left;
      }
      table {
        width: 100%;
      }
      .error {
        color: #b91c1c;
      }
      .success {
        color: #047857;
      }
    `,
  ],
})
export class Devoluciones implements OnInit {
  ventas: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  notas: any[] = [];
  politica: any = null;
  busy = false;
  error = '';
  message = '';
  api = environment.apiUrl;
  constructor(
    private http: HttpClient,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit() {
    this.load();
  }
  async load() {
    try {
      [this.ventas, this.productos, this.tallas, this.colores, this.notas, this.politica] =
        await Promise.all(
          [
            '/ventas/',
            '/catalogo/productos',
            '/catalogo/tallas',
            '/catalogo/colores',
            '/devoluciones/notas',
            '/devoluciones/politica/' + this.auth.getEmpresaId(),
          ].map((path) => firstValueFrom(this.http.get<any>(this.api + path))),
        );
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudieron cargar los datos';
    }
    this.cdr.detectChanges();
  }
  async save(data: any) {
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.http.post(this.api + '/devoluciones/crear-nota', data));
      this.message = 'Solicitud registrada';
      await this.load();
    } catch (e: any) {
      this.error = typeof e.error?.detail === 'string' ? e.error.detail : 'Revise los datos';
    } finally {
      this.busy = false;
      this.cdr.detectChanges();
    }
  }
  async savePolicy() {
    this.error = '';
    try {
      await firstValueFrom(
        this.http.put(
          this.api + '/devoluciones/politica/' + this.auth.getEmpresaId(),
          this.politica,
        ),
      );
      this.message = 'Política guardada';
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudo guardar';
    }
    this.cdr.detectChanges();
  }
  async complete(note: any) {
    this.error = '';
    try {
      await firstValueFrom(
        this.http.put(this.api + '/devoluciones/notas/' + note.id + '/completar', {}),
      );
      this.message = 'Devolución completada e inventario actualizado';
      await this.load();
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudo completar';
    }
    this.cdr.detectChanges();
  }
}
