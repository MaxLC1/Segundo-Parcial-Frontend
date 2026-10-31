import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaasService, EmpresaSaaS, PlanSaaS, LimitesEmpresa } from '../../../services/saas.service';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-saas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saas.html',
  styleUrls: ['./saas.css']
})
export class SaasComponent implements OnInit {
  empresas: EmpresaSaaS[] = [];
  planes: PlanSaaS[] = [];
  empresaActual: EmpresaSaaS | null = null;
  limites: LimitesEmpresa | null = null;
  
  empresaIdSeleccionada: number = 1;
  isLoading = false;
  mensajeExito: string | null = null;

  constructor(
    private saasService: SaasService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.empresaIdSeleccionada = this.auth.getEmpresaId();
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.saasService.getPlanes().subscribe({
      next: (planes) => this.planes = planes,
      error: (e) => console.error('Error cargando planes:', e)
    });

    this.saasService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas = empresas;
        this.seleccionarEmpresa(this.empresaIdSeleccionada);
      },
      error: (e) => console.error('Error cargando empresas:', e)
    });
  }

  seleccionarEmpresa(empresaId: number) {
    this.empresaIdSeleccionada = empresaId;
    this.auth.setEmpresaId(empresaId);

    this.saasService.getEmpresa(empresaId).subscribe({
      next: (emp) => {
        this.empresaActual = emp;
        this.cargarLimites(empresaId);
      },
      error: (e) => console.error('Error al obtener empresa:', e)
    });
  }

  cargarLimites(empresaId: number) {
    this.saasService.getLimitesEmpresa(empresaId).subscribe({
      next: (lim) => {
        this.limites = lim;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPlan(planId: number) {
    if (!this.empresaActual) return;
    this.isLoading = true;
    this.mensajeExito = null;

    this.saasService.asignarPlan(this.empresaActual.id, planId, 365).subscribe({
      next: () => {
        this.mensajeExito = '¡Plan de suscripción actualizado correctamente!';
        this.cargarLimites(this.empresaActual!.id);
        this.cargarDatos();
      },
      error: (e) => {
        this.isLoading = false;
        alert('Error al cambiar de plan: ' + (e.error?.detail || JSON.stringify(e)));
      }
    });
  }
}
