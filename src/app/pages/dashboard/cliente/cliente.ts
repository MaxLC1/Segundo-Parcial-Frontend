import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReturnForm } from '../../../services/return-form';
@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReturnForm],
  template: `
    <h2>Mis compras y beneficios</h2>
    <p role="alert" *ngIf="error">{{ error }}</p>
    <p role="status">{{ message }}</p>
    <nav>
      <button *ngFor="let t of tabs" (click)="tab = t" [class.active]="tab === t">{{ t }}</button>
    </nav>
    <section *ngIf="tab === 'Mis cupones'">
      <article *ngFor="let c of cupones">
        <h3>{{ c.nombre }}</h3>
        <strong>{{ c.codigo }}</strong>
        <p>
          {{ c.valor }} {{ c.tipo === 'PORCENTAJE' ? '%' : 'Bs.' }} · Vence
          {{ c.fecha_vencimiento | date: 'shortDate' }}
        </p>
        <p>Válido para {{ restrictions(c) }}. Un uso por cliente.</p>
      </article>
      <p *ngIf="!cupones.length">No tienes cupones vigentes.</p>
    </section>
    <section *ngIf="tab === 'Mis notas'">
      <article *ngFor="let n of notas">
        <h3>{{ n.codigo_nota }}</h3>
        <p>{{ n.tipo_solicitud }} · Compra #{{ n.venta_id }}</p>
        <p>{{ n.prenda_devuelta_info }} → {{ n.prenda_nueva_info || 'Devolución' }}</p>
        <p>{{ n.mensaje_notificacion }}</p>
        <p>Vence {{ n.fecha_expiracion | date: 'shortDate' }}</p>
        <button (click)="print(n)">Imprimir comprobante</button>
      </article>
      <p *ngIf="!notas.length">No tienes notas vigentes.</p>
    </section>
    <section *ngIf="tab === 'Solicitar cambio o devolución'">
      <app-return-form
        [ventas]="ventas"
        [productos]="productos"
        [tallas]="tallas"
        [colores]="colores"
        [busy]="busy"
        (save)="save($event)"
      />
      <p *ngIf="!ventas.length">Todavía no tienes compras confirmadas.</p>
    </section>
    <section *ngIf="tab === 'Notificaciones'">
      <article *ngFor="let n of avisos">
        <h3>{{ n.titulo }}</h3>
        <p>{{ n.mensaje }}</p>
        <small>{{ n.fecha | date: 'short' }}</small>
      </article>
      <p *ngIf="!avisos.length">No tienes notificaciones.</p>
    </section>
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; color: #0f172a; }
    h2 { font-size: 1.85rem; font-weight: 800; margin-bottom: 1.5rem; background: linear-gradient(135deg, #f97316, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    nav { display: flex; gap: 0.5rem; background: #e2e8f0; padding: 0.35rem; border-radius: 12px; margin-bottom: 1.5rem; width: fit-content; }
    nav button { background: transparent; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    nav button.active, nav button:hover { background: #f97316; color: white; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
    article { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; position: relative; }
    article h3 { margin: 0 0 0.5rem 0; font-size: 1.2rem; color: #0f172a; }
    article strong { display: inline-block; background: #ffedd5; color: #c2410c; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; }
    article p { margin: 0.35rem 0; color: #475569; font-size: 0.9rem; }
    article button { margin-top: 0.75rem; background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; border: none; padding: 0.55rem 1.1rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    p[role="alert"] { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1rem; }
    p[role="status"] { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1rem; }
  `],
})
export class Cliente implements OnInit {
  tabs = ['Mis cupones', 'Mis notas', 'Solicitar cambio o devolución', 'Notificaciones'];
  tab = this.tabs[0];
  cupones: any[] = [];
  notas: any[] = [];
  ventas: any[] = [];
  productos: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  avisos: any[] = [];
  error = '';
  message = '';
  busy = false;
  api = environment.apiUrl;
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit() {
    this.load();
  }
  async load() {
    try {
      [
        this.cupones,
        this.notas,
        this.ventas,
        this.productos,
        this.tallas,
        this.colores,
        this.avisos,
      ] = await Promise.all(
        [
          '/cliente/cupones',
          '/cliente/notas',
          '/cliente/compras',
          '/catalogo/productos',
          '/catalogo/tallas',
          '/catalogo/colores',
          '/cliente/notificaciones',
        ].map((p) => firstValueFrom(this.http.get<any[]>(this.api + p))),
      );
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudieron cargar tus datos';
    }
    this.cdr.detectChanges();
  }
  async save(data: any) {
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.http.post(this.api + '/cliente/solicitudes', data));
      this.message = 'Solicitud registrada. Puedes consultar tu comprobante en Mis notas.';
      await this.load();
      this.tab = 'Mis notas';
    } catch (e: any) {
      this.error =
        typeof e.error?.detail === 'string' ? e.error.detail : 'Revisa los datos de tu solicitud';
    } finally {
      this.busy = false;
      this.cdr.detectChanges();
    }
  }
  restrictions(c: any) {
    const criteria = c.criterios || {};
    const groups: any = {
      productos: this.productos,
      tallas: this.tallas,
      temporadas: this.productos.map((p) => p.temporada).filter(Boolean),
      categorias: this.productos.map((p) => p.categoria).filter(Boolean),
    };
    const labels: any = {
      productos: 'Prendas',
      tallas: 'Tallas',
      temporadas: 'Temporadas',
      categorias: 'Categorías',
    };
    return (
      Object.keys(groups)
        .filter((k) => criteria[k]?.length)
        .map(
          (k) =>
            labels[k] +
            ': ' +
            criteria[k]
              .map((id: number) => groups[k].find((x: any) => x.id === id)?.nombre || '#' + id)
              .join(', '),
        )
        .join(' · ') || 'todo el catálogo'
    );
  }

  print(note: any) {
    const w = window.open('', '_blank', 'width=800,height=650');
    if (!w) {
      this.error = 'Permite ventanas emergentes para imprimir';
      return;
    }
    w.document.title = note.codigo_nota;
    const title = w.document.createElement('h1');
    title.textContent = 'Comprobante de devolución';
    w.document.body.appendChild(title);
    for (const value of [
      note.codigo_nota,
      'Compra #' + note.venta_id,
      note.tipo_solicitud,
      note.prenda_devuelta_info,
      note.prenda_nueva_info || '',
      note.mensaje_notificacion,
      'Vigente hasta: ' + new Date(note.fecha_expiracion).toLocaleDateString(),
    ]) {
      const p = w.document.createElement('p');
      p.textContent = value;
      w.document.body.appendChild(p);
    }
    w.document.close();
    w.focus();
    w.print();
  }
}
