import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-comercial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Cupones, avisos y traspasos</h2>
    <p role="alert">{{ error }}</p>
    <p role="status">{{ message }}</p>
    <nav>
      <button *ngFor="let t of ['Cupones', 'Notificaciones', 'Traspasos']" (click)="tab = t">
        {{ t }}
      </button>
    </nav>
    <section *ngIf="tab === 'Cupones'">
      <h3>Nuevo cupón</h3>
      <form (ngSubmit)="createCoupon()">
        <label>Nombre<input name="nombre" [(ngModel)]="coupon.nombre" required /></label>
        <label
          >Cliente<select name="cliente" [(ngModel)]="coupon.usuario_id">
            <option [ngValue]="null">Todos los clientes</option>
            <option *ngFor="let u of clientes" [ngValue]="u.id">{{ u.nombre_completo }}</option>
          </select></label
        >
        <label
          >Tipo<select name="tipo" [(ngModel)]="coupon.tipo">
            <option value="MONTO">Importe en Bs.</option>
            <option value="PORCENTAJE">Porcentaje</option>
          </select></label
        ><label
          >Valor<input
            name="valor"
            type="number"
            min="0.01"
            step="0.01"
            [(ngModel)]="coupon.valor"
            required
        /></label>
        <label
          >Vencimiento<input
            name="vence"
            type="datetime-local"
            [(ngModel)]="coupon.fecha_vencimiento"
            required /></label
        ><label
          >Máximo de canjes<input name="usos" type="number" min="1" [(ngModel)]="coupon.max_usos"
        /></label>
        <label
          >Productos<select name="productos" multiple [(ngModel)]="coupon.criterios.productos">
            <option *ngFor="let p of productos" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        >
        <label
          >Temporadas<select name="temporadas" multiple [(ngModel)]="coupon.criterios.temporadas">
            <option *ngFor="let p of temporadas" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        >
        <label
          >Tallas<select name="tallas" multiple [(ngModel)]="coupon.criterios.tallas">
            <option *ngFor="let p of tallas" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        >
        <p>
          Sin selección, se aplica a todos. Si combinas filtros, la prenda debe cumplirlos todos.
        </p>
        <button type="submit" [disabled]="busy">Crear cupón</button>
      </form>
      <article *ngFor="let c of cupones">
        <strong>{{ c.nombre }} · {{ c.codigo }}</strong>
        <p>
          {{ c.valor }} {{ c.tipo === 'MONTO' ? 'Bs.' : '%' }} · {{ c.usos }} /
          {{ c.max_usos }} canjes · {{ c.activo ? 'Activo' : 'Desactivado' }}
        </p>
        <button *ngIf="c.activo" (click)="deactivate(c)">Desactivar</button>
      </article>
    </section>
    <section *ngIf="tab === 'Notificaciones'">
      <h3>Publicar aviso a los clientes de la empresa</h3>
      <form (ngSubmit)="notify()">
        <label
          >Título<input name="titulo" [(ngModel)]="aviso.titulo" maxlength="120" required /></label
        ><label
          >Mensaje<textarea
            name="mensaje"
            [(ngModel)]="aviso.mensaje"
            maxlength="1000"
            required
          ></textarea></label
        ><button [disabled]="busy">Publicar aviso</button>
      </form>
    </section>
    <section *ngIf="tab === 'Traspasos'">
      <h3>Traspasar mercancía</h3>
      <form (ngSubmit)="transfer()">
        <label
          >Origen<select name="origen" [(ngModel)]="traspaso.origen_id" required>
            <option *ngFor="let s of sucursales" [ngValue]="s.id">{{ s.nombre }}</option>
          </select></label
        ><label
          >Destino<select name="destino" [(ngModel)]="traspaso.destino_id" required>
            <option *ngFor="let s of sucursales" [ngValue]="s.id">{{ s.nombre }}</option>
          </select></label
        >
        <label
          >Prenda<select name="producto" [(ngModel)]="item.producto_id" required>
            <option *ngFor="let p of productos" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        ><label
          >Talla<select name="talla" [(ngModel)]="item.talla_id" required>
            <option *ngFor="let p of tallas" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        ><label
          >Color<select name="color" [(ngModel)]="item.color_id" required>
            <option *ngFor="let p of colores" [ngValue]="p.id">{{ p.nombre }}</option>
          </select></label
        ><label
          >Cantidad<input
            name="cantidad"
            type="number"
            min="1"
            [(ngModel)]="item.cantidad"
            required /></label
        ><button [disabled]="busy">Confirmar traspaso</button>
      </form>
      <article *ngFor="let t of traspasos">
        Traspaso #{{ t.id }} · {{ branch(t.origen_id) }} → {{ branch(t.destino_id) }} ·
        {{ t.estado }} · {{ t.fecha | date: 'short' }}
      </article>
    </section>
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; color: #0f172a; }
    h2 { font-size: 1.85rem; font-weight: 800; margin-bottom: 1.5rem; background: linear-gradient(135deg, #f97316, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a; }
    nav { display: flex; gap: 0.5rem; background: #e2e8f0; padding: 0.35rem; border-radius: 12px; margin-bottom: 1.5rem; width: fit-content; }
    nav button { background: transparent; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    nav button.active, nav button:hover { background: #f97316; color: white; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; font-weight: 700; color: #334155; }
    input, select, textarea { padding: 0.65rem 0.85rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: white; color: #0f172a; outline: none; transition: border-color 0.2s; }
    input:focus, select:focus, textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2); }
    button[type="submit"], form > button { grid-column: 1 / -1; width: fit-content; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35); }
    article { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
    article strong { color: #0f172a; font-size: 1rem; }
    article p { margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.85rem; }
    article button { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    p[role="alert"] { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1rem; }
    p[role="status"] { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1rem; }
    form p { grid-column: 1 / -1; color: #64748b; font-size: 0.85rem; }
  `],
})
export class Comercial implements OnInit {
  tab = 'Cupones';
  api = environment.apiUrl;
  error = '';
  message = '';
  busy = false;
  clientes: any[] = [];
  productos: any[] = [];
  temporadas: any[] = [];
  tallas: any[] = [];
  colores: any[] = [];
  sucursales: any[] = [];
  cupones: any[] = [];
  traspasos: any[] = [];
  coupon: any = {
    nombre: '',
    usuario_id: null,
    tipo: 'MONTO',
    valor: 10,
    fecha_vencimiento: '',
    max_usos: 1,
    criterios: { productos: [], temporadas: [], tallas: [], categorias: [] },
  };
  aviso = { titulo: '', mensaje: '' };
  traspaso: any = { origen_id: null, destino_id: null };
  item: any = { producto_id: null, talla_id: null, color_id: null, cantidad: 1 };
  transferId = crypto.randomUUID();
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
        this.clientes,
        this.productos,
        this.temporadas,
        this.tallas,
        this.colores,
        this.sucursales,
        this.cupones,
        this.traspasos,
      ] = await Promise.all(
        [
          '/seguridad/usuarios',
          '/catalogo/productos',
          '/catalogo/temporadas',
          '/catalogo/tallas',
          '/catalogo/colores',
          '/sucursales/sucursales',
          '/comercial/cupones',
          '/comercial/traspasos',
        ].map((p) => firstValueFrom(this.http.get<any[]>(this.api + p))),
      );
      this.clientes = this.clientes.filter((u) => u.rol?.nombre === 'Cliente');
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudieron cargar los datos';
    }
    this.cdr.detectChanges();
  }
  async run(path: string, data: any) {
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.http.post(this.api + path, data));
      this.message = 'Operación registrada';
      await this.load();
      return true;
    } catch (e: any) {
      this.error =
        typeof e.error?.detail === 'string'
          ? e.error.detail
          : 'Revise los campos e intente nuevamente';
      return false;
    } finally {
      this.busy = false;
      this.cdr.detectChanges();
    }
  }
  createCoupon() {
    return this.run('/comercial/cupones', this.coupon);
  }
  notify() {
    return this.run('/comercial/notificaciones', this.aviso);
  }
  async transfer() {
    if (
      await this.run('/comercial/traspasos', {
        ...this.traspaso,
        operacion_uuid: this.transferId,
        detalles: [this.item],
      })
    )
      this.transferId = crypto.randomUUID();
  }
  branch(id: number) {
    return this.sucursales.find((s) => s.id === id)?.nombre || id;
  }
  async deactivate(c: any) {
    try {
      await firstValueFrom(
        this.http.put(this.api + '/comercial/cupones/' + c.id + '/desactivar', {}),
      );
      await this.load();
    } catch (e: any) {
      this.error = e.error?.detail || 'No se pudo desactivar';
      this.cdr.detectChanges();
    }
  }
}
