import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-return-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <form (ngSubmit)="submit()" class="return-grid">
    <label
      >Compra original<select
        name="venta"
        [(ngModel)]="data.venta_id"
        (ngModelChange)="resetDetail()"
        required
      >
        <option [ngValue]="0">Seleccione una compra</option>
        <option *ngFor="let v of ventas" [ngValue]="v.id">
          Compra #{{ v.id }} · Bs. {{ v.total }}
        </option>
      </select></label
    >
    <label
      >Prenda comprada<select
        name="detalle"
        [(ngModel)]="data.detalle_venta_id"
        (ngModelChange)="changeType()"
        required
      >
        <option [ngValue]="0">Seleccione una prenda</option>
        <option *ngFor="let d of sale?.detalles || []" [ngValue]="d.id">
          {{ name(d.producto_id) }} · talla {{ label(tallas, d.talla_id) }} ·
          {{ label(colores, d.color_id) }} · {{ d.cantidad }} unidades
        </option>
      </select></label
    >
    <label
      >Tipo<select name="tipo" [(ngModel)]="data.tipo_solicitud" (ngModelChange)="changeType()">
        <option>Cambio por Mayor Valor</option>
        <option>Cambio por Menor Valor</option>
        <option>Cambio de Talla o Color</option>
        <option>Devolución Directa</option>
      </select></label
    >
    <label
      >Cantidad<input
        name="cantidad"
        type="number"
        min="1"
        [max]="detail?.cantidad || 1"
        [(ngModel)]="data.cantidad"
        required
    /></label>
    <ng-container *ngIf="data.tipo_solicitud !== 'Devolución Directa'">
      <label
        >Prenda nueva<select
          name="producto"
          [(ngModel)]="data.producto_nuevo_id"
          [disabled]="data.tipo_solicitud === 'Cambio de Talla o Color'"
          required
        >
          <option [ngValue]="null">Seleccione</option>
          <option *ngFor="let p of productos" [ngValue]="p.id">
            {{ p.nombre }} · Bs. {{ p.precio }}
          </option>
        </select></label
      >
      <label
        >Talla<select name="talla" [(ngModel)]="data.talla_nueva_id" required>
          <option [ngValue]="null">Seleccione</option>
          <option *ngFor="let t of tallas" [ngValue]="t.id">{{ t.nombre }}</option>
        </select></label
      >
      <label
        >Color<select name="color" [(ngModel)]="data.color_nuevo_id" required>
          <option [ngValue]="null">Seleccione</option>
          <option *ngFor="let c of colores" [ngValue]="c.id">{{ c.nombre }}</option>
        </select></label
      >
    </ng-container>
    <label
      >Motivo<textarea
        name="motivo"
        [(ngModel)]="data.motivo"
        minlength="3"
        maxlength="255"
        required
      ></textarea>
    </label>
    <div class="summary-banner">
      <span class="summary-label">Importe Original de la Prenda:</span>
      <span class="summary-val">Bs. {{ ((detail?.precio_unitario || 0) * data.cantidad).toFixed(2) }}</span>
      <span class="summary-hint">La tienda aplicará su política de devolución y cálculo de diferencias automáticamente.</span>
    </div>
    <div class="submit-row">
      <button
        class="btn-submit-return"
        type="submit"
        [disabled]="busy || !data.venta_id || !data.detalle_venta_id"
      >
        {{ busy ? 'Procesando...' : 'Registrar Solicitud de Devolución' }}
      </button>
    </div>
  </form>`,
  styles: [
    `
      .return-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 18px;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      input,
      select,
      textarea {
        padding: 10px 14px;
        font-size: 0.9rem;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #ffffff;
        color: #1e293b;
        outline: none;
        transition: all 0.2s ease;
      }
      input:focus,
      select:focus,
      textarea:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      .summary-banner {
        grid-column: 1/-1;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
      }
      .summary-label {
        font-size: 0.85rem;
        color: #475569;
        font-weight: 500;
      }
      .summary-val {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
      }
      .summary-hint {
        font-size: 0.8rem;
        color: #64748b;
        margin-left: auto;
      }
      .submit-row {
        grid-column: 1/-1;
        margin-top: 4px;
      }
      .btn-submit-return {
        padding: 12px 26px;
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        font-size: 0.92rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.22);
        transition: all 0.2s ease;
      }
      .btn-submit-return:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(234, 88, 12, 0.32);
      }
      .btn-submit-return:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ReturnForm {
  @Input() ventas: any[] = [];
  @Input() productos: any[] = [];
  @Input() tallas: any[] = [];
  @Input() colores: any[] = [];
  @Input() busy = false;
  @Output() save = new EventEmitter<any>();
  data: any = {
    venta_id: 0,
    detalle_venta_id: 0,
    cantidad: 1,
    tipo_solicitud: 'Devolución Directa',
    producto_nuevo_id: null,
    talla_nueva_id: null,
    color_nuevo_id: null,
    motivo: '',
  };
  get sale() {
    return this.ventas.find((v) => v.id === this.data.venta_id);
  }
  get detail() {
    return this.sale?.detalles.find((d: any) => d.id === this.data.detalle_venta_id);
  }
  name(id: number) {
    return this.productos.find((p) => p.id === id)?.nombre || 'Producto #' + id;
  }
  label(items: any[], id: number) {
    return items.find((p) => p.id === id)?.nombre || id;
  }
  resetDetail() {
    this.data.detalle_venta_id = 0;
    this.data.cantidad = 1;
    this.changeType();
  }
  changeType() {
    this.data.producto_nuevo_id =
      this.data.tipo_solicitud === 'Cambio de Talla o Color' ? this.detail?.producto_id : null;
    this.data.talla_nueva_id = null;
    this.data.color_nuevo_id = null;
  }
  submit() {
    if (this.data.tipo_solicitud === 'Cambio de Talla o Color')
      this.data.producto_nuevo_id = this.detail?.producto_id;
    this.save.emit({ ...this.data });
  }
}
