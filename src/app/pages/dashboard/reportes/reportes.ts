import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { SaasService, ReporteIAResponse, DashboardMLResponse } from '../../../services/saas.service';
import { Auth } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mlChartCanvas') mlChartCanvas!: ElementRef<HTMLCanvasElement>;

  activeTab: 'ia' | 'ml' | 'kpis' = 'ia';
  
  // Estado Empresa y Tenant
  empresaId: number = 1;
  empresaNombre: string = 'Zara Bolivia S.A.';
  planPermiteIA: boolean = true;
  planNombre: string = 'Profesional';

  // Reporte Generativo
  queryTexto: string = 'Mostrame las ventas agrupadas por sucursal';
  reporteIA: ReporteIAResponse | null = null;
  isLoadingIA = false;
  isListeningVoice = false;
  errorMensajeIA: string | null = null;
  chartInstance: Chart | null = null;

  // Machine Learning
  dashboardML: DashboardMLResponse | null = null;
  isLoadingML = false;
  mlChartInstance: Chart | null = null;
  prediccionDias: number = 7;
  prediccionesDemanda: any[] = [];

  // KPIs Clásicos
  reporteKpis: any = null;
  isLoadingKpis = false;

  consultasSugeridas = [
    'Mostrame las ventas agrupadas por sucursal',
    '¿Cuáles fueron los diez productos más vendidos este mes?',
    'Generá un gráfico de ventas por semana',
    'Mostrame los productos con menor existencia',
    '¿Qué categorías generaron mayores ingresos?'
  ];

  constructor(
    private saasService: SaasService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatosEmpresa();
  }

  ngAfterViewInit() {
    // Si ya hay reporte cargado, renderizar gráfico
    if (this.reporteIA) {
      this.renderChart();
    }
  }

  cargarDatosEmpresa() {
    this.empresaId = this.auth.getEmpresaId();
    this.empresaNombre = this.auth.getEmpresaNombre();

    this.saasService.getLimitesEmpresa(this.empresaId).subscribe({
      next: (limites) => {
        this.planNombre = limites.plan_nombre;
        this.planPermiteIA = limites.permite_ia_generativa;
        this.cdr.detectChanges();

        if (this.planPermiteIA) {
          this.ejecutarConsultaIA(this.queryTexto);
        } else {
          this.errorMensajeIA = `Su empresa (${this.empresaNombre}) cuenta con el Plan ${this.planNombre}. Los reportes generativos con IA y Analítica ML están disponibles exclusivamente en el Plan Profesional.`;
          this.activeTab = 'kpis';
          this.cargarKpisConvencionales();
        }
      },
      error: (err) => {
        console.error('Error al consultar límites de empresa:', err);
        // Fallback
        this.ejecutarConsultaIA(this.queryTexto);
      }
    });
  }

  seleccionarTab(tab: 'ia' | 'ml' | 'kpis') {
    this.activeTab = tab;
    if (tab === 'ml' && !this.dashboardML && this.planPermiteIA) {
      this.cargarDashboardML();
    } else if (tab === 'kpis' && !this.reporteKpis) {
      this.cargarKpisConvencionales();
    }
    this.cdr.detectChanges();
  }

  // =========================================================================
  // REPORTES GENERATIVOS CON IA (Texto y Voz)
  // =========================================================================

  ejecutarConsultaIA(query?: string) {
    if (query) {
      this.queryTexto = query;
    }
    if (!this.queryTexto.trim()) return;

    this.isLoadingIA = true;
    this.errorMensajeIA = null;
    this.cdr.detectChanges();

    this.saasService.generarReporteGenerativo(this.queryTexto, this.empresaId).subscribe({
      next: (data) => {
        this.reporteIA = data;
        this.isLoadingIA = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderChart(), 100);
      },
      error: (err) => {
        this.isLoadingIA = false;
        this.errorMensajeIA = err.error?.detail || 'Error al procesar la solicitud con Inteligencia Artificial.';
        this.cdr.detectChanges();
      }
    });
  }

  iniciarReconocimientoVoz() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta la API de reconocimiento de voz. Por favor usa Google Chrome o Microsoft Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListeningVoice = true;
      this.cdr.detectChanges();
    };

    recognition.onresult = (event: any) => {
      const transcripcion = event.results[0][0].transcript;
      this.queryTexto = transcripcion;
      this.isListeningVoice = false;
      this.cdr.detectChanges();
      this.ejecutarConsultaIA(transcripcion);
    };

    recognition.onerror = (event: any) => {
      console.warn('Error en reconocimiento de voz:', event.error);
      this.isListeningVoice = false;
      this.cdr.detectChanges();
    };

    recognition.onend = () => {
      this.isListeningVoice = false;
      this.cdr.detectChanges();
    };

    recognition.start();
  }

  renderChart() {
    if (!this.chartCanvas || !this.reporteIA) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const tipo: any = this.reporteIA.grafico_tipo || 'bar';
    const labels = this.reporteIA.grafico_data?.labels || [];

    const palette = [
      '#f97316', // Naranja FashionStore
      '#6366f1', // Indigo elegante
      '#10b981', // Verde esmeralda
      '#f59e0b', // Ámbar dorado
      '#ec4899', // Rosa
      '#06b6d4', // Cyan
      '#8b5cf6', // Violeta
      '#3b82f6', // Azul
    ];

    const datasets = (this.reporteIA.grafico_data?.datasets || []).map((d: any) => {
      if (tipo === 'bar') {
        const bgColors = labels.map((_: any, i: number) => palette[i % palette.length]);
        return {
          ...d,
          backgroundColor: bgColors,
          borderColor: bgColors,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        };
      }
      if (tipo === 'line') {
        return {
          ...d,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: '#ea580c',
          pointRadius: 6,
          pointHoverRadius: 8
        };
      }
      return {
        ...d,
        backgroundColor: palette.slice(0, labels.length),
        borderRadius: 6
      };
    });

    this.chartInstance = new Chart(ctx, {
      type: tipo,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: tipo === 'pie' || tipo === 'doughnut',
            position: 'bottom',
            labels: {
              color: '#334155',
              font: { weight: 'bold', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#f8fafc',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: tipo === 'bar' || tipo === 'line' ? {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#475569',
              font: { weight: '600', size: 12 }
            },
            grid: { color: 'rgba(226, 232, 240, 0.8)' }
          },
          x: {
            ticks: {
              color: '#334155',
              font: { weight: '600', size: 12 }
            },
            grid: { display: false }
          }
        } : undefined
      }
    });
  }

  descargarExcel() {
    if (!this.reporteIA) return;
    this.saasService.exportarExcel(this.reporteIA).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_fashionstore_${this.reporteIA?.tipo_reporte}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  descargarPdf() {
    if (!this.reporteIA) return;
    this.saasService.exportarPdf(this.reporteIA).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_fashionstore_${this.reporteIA?.tipo_reporte}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // =========================================================================
  // MACHINE LEARNING
  // =========================================================================

  cargarDashboardML() {
    this.isLoadingML = true;
    this.cdr.detectChanges();

    this.saasService.getDashboardML(this.empresaId).subscribe({
      next: (data) => {
        this.dashboardML = data;
        this.isLoadingML = false;
        this.cdr.detectChanges();
        this.cargarPrediccionDemanda();
      },
      error: (err) => {
        this.isLoadingML = false;
        console.error('Error al cargar dashboard ML:', err);
        this.cdr.detectChanges();
      }
    });
  }

  cargarPrediccionDemanda() {
    this.saasService.predecirDemanda(this.empresaId, this.prediccionDias).subscribe({
      next: (res) => {
        this.prediccionesDemanda = res.predicciones;
        this.cdr.detectChanges();
        setTimeout(() => this.renderMLChart(), 100);
      },
      error: (err) => console.error('Error al predecir demanda:', err)
    });
  }

  renderMLChart() {
    if (!this.mlChartCanvas || this.prediccionesDemanda.length === 0) return;

    if (this.mlChartInstance) {
      this.mlChartInstance.destroy();
    }

    const ctx = this.mlChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.mlChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.prediccionesDemanda.map(p => p.fecha),
        datasets: [{
          label: 'Demanda Estimada (BOB)',
          data: this.prediccionesDemanda.map(p => p.ventas_estimadas_monto),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false, grid: { color: 'rgba(255, 255, 255, 0.08)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // =========================================================================
  // KPIS CONVENCIONALES
  // =========================================================================

  cargarKpisConvencionales() {
    this.isLoadingKpis = true;
    this.cdr.detectChanges();

    this.saasService.getLimitesEmpresa(this.empresaId).subscribe();
    fetch(`${environment.apiUrl}/ventas/reportes?empresa_id=${this.empresaId}`)
      .then(res => res.json())
      .then(data => {
        this.reporteKpis = data;
        this.isLoadingKpis = false;
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error('Error al cargar KPIs:', err);
        this.isLoadingKpis = false;
        this.cdr.detectChanges();
      });
  }

  simularMejoraPlanProfesional() {
    this.saasService.asignarPlan(this.empresaId, 2, 365).subscribe({
      next: () => {
        alert('¡Plan actualizado con éxito al Plan Profesional! Ahora tienes acceso completo a IA Generativa y hasta 10 sucursales.');
        this.cargarDatosEmpresa();
        this.seleccionarTab('ia');
      },
      error: (e) => alert('Error al actualizar plan: ' + JSON.stringify(e))
    });
  }
}
