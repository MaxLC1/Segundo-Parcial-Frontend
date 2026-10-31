import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlanSaaS {
  id: number;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  max_sucursales: number;
  permite_ia_generativa: boolean;
  permite_offline: boolean;
  permite_cambios_prendas: boolean;
  activo: boolean;
}

export interface EmpresaSaaS {
  id: number;
  nombre: string;
  codigo: string;
  nit_rut?: string;
  telefono?: string;
  email_contacto?: string;
  direccion_fiscal?: string;
  activa: boolean;
  suscripciones: Array<{
    id: number;
    plan_id: number;
    fecha_inicio: string;
    fecha_vencimiento: string;
    estado: string;
    plan?: PlanSaaS;
  }>;
}

export interface LimitesEmpresa {
  empresa_id: number;
  empresa_nombre: string;
  plan_nombre: string;
  max_sucursales: number;
  sucursales_activas: number;
  permite_ia_generativa: boolean;
  permite_offline: boolean;
  suscripcion_activa: boolean;
  fecha_vencimiento?: string;
}

export interface ReporteIAResponse {
  titulo: string;
  tipo_reporte: string;
  narrativa_ia: string;
  filtros_detectados: any;
  columnas: string[];
  filas: any[];
  grafico_tipo: string;
  grafico_data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: any;
      borderColor?: any;
      borderWidth?: number;
    }>;
  };
  fecha_generacion: string;
}

export interface DashboardMLResponse {
  empresa_id: number;
  supervisado: {
    algoritmo: string;
    r2_score: number;
    mse: number;
    muestras: number;
  };
  segmentacion_clientes: Array<{
    cluster_id: number;
    nombre_segmento: string;
    cantidad_clientes: number;
    porcentaje: number;
    ticket_promedio_bob: number;
    frecuencia_compras_mes: number;
  }>;
  insights_ia: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SaasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPlanes(): Observable<PlanSaaS[]> {
    return this.http.get<PlanSaaS[]>(`${this.apiUrl}/saas/planes`);
  }

  getEmpresas(): Observable<EmpresaSaaS[]> {
    return this.http.get<EmpresaSaaS[]>(`${this.apiUrl}/saas/empresas`);
  }

  getEmpresa(id: number): Observable<EmpresaSaaS> {
    return this.http.get<EmpresaSaaS>(`${this.apiUrl}/saas/empresas/${id}`);
  }

  getLimitesEmpresa(id: number): Observable<LimitesEmpresa> {
    return this.http.get<LimitesEmpresa>(`${this.apiUrl}/saas/empresas/${id}/limites`);
  }

  asignarPlan(empresaId: number, planId: number, dias: number = 365): Observable<any> {
    return this.http.post(`${this.apiUrl}/saas/suscripciones/asignar`, {
      empresa_id: empresaId,
      plan_id: planId,
      dias_duracion: dias
    });
  }

  // =========================================================================
  // REPORTES GENERATIVOS CON IA
  // =========================================================================

  generarReporteGenerativo(query: string, empresaId: number): Observable<ReporteIAResponse> {
    return this.http.post<ReporteIAResponse>(`${this.apiUrl}/ia/reporte-generativo`, {
      query: query,
      empresa_id: empresaId
    });
  }

  exportarExcel(reporteData: ReporteIAResponse): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/ia/exportar-excel`, reporteData, {
      responseType: 'blob'
    });
  }

  exportarPdf(reporteData: ReporteIAResponse): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/ia/exportar-pdf`, reporteData, {
      responseType: 'blob'
    });
  }

  // =========================================================================
  // MACHINE LEARNING
  // =========================================================================

  getDashboardML(empresaId: number): Observable<DashboardMLResponse> {
    return this.http.get<DashboardMLResponse>(`${this.apiUrl}/ia/ml/dashboard/${empresaId}`);
  }

  predecirDemanda(empresaId: number, dias: number = 7): Observable<any> {
    return this.http.post(`${this.apiUrl}/ia/ml/predecir-demanda`, {
      empresa_id: empresaId,
      dias_a_futuro: dias
    });
  }
}
