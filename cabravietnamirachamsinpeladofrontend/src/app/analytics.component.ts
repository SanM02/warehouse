import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { AnalyticsService } from './analytics.service';
import { DashboardStats, VentaAnalytics, ProductoVendido, ClienteFrecuente, MarcaPopular } from './analytics.model';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-analytics',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid px-4">
      <h1 class="mt-4">Análisis Avanzado</h1>
      <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a routerLink="/">Dashboard</a></li>
        <li class="breadcrumb-item active">Analytics Avanzado</li>
      </ol>

      <!-- Métricas de rendimiento -->
      <div class="row" *ngIf="stats">
        <div class="col-12">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-tachometer-alt me-1"></i>
              Métricas de Rendimiento del Negocio
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="text-center">
                    <h5 class="text-primary">₱ {{ stats.ventas_mes | number:'1.0-0' }}</h5>
                    <small class="text-muted">Facturación Mensual</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h5 class="text-success">{{ stats.productos_vendidos_hoy }}</h5>
                    <small class="text-muted">Productos Vendidos Hoy</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h5 class="text-info">{{ stats.clientes_unicos_mes }}</h5>
                    <small class="text-muted">Clientes Únicos</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h5 class="text-warning">₱ {{ promedioVentaDiaria | number:'1.0-0' }}</h5>
                    <small class="text-muted">Promedio Diario</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos de tendencias -->
      <div class="row">
        <div class="col-xl-8">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-chart-line me-1"></i>
              Tendencias de Ventas Semanales
            </div>
            <div class="card-body">
              <canvas #tendenciasChart style="height: 400px;"></canvas>
            </div>
          </div>
        </div>
        <div class="col-xl-4">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-chart-pie me-1"></i>
              Distribución por Marcas
            </div>
            <div class="card-body">
              <canvas #marcasPieChart style="height: 400px;"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Análisis de productos y clientes -->
      <div class="row">
        <div class="col-xl-6">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-box me-1"></i>
              Top 10 Productos Más Vendidos
            </div>
            <div class="card-body">
              <canvas #productosBarChart style="height: 350px;"></canvas>
            </div>
          </div>
        </div>
        <div class="col-xl-6">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-users me-1"></i>
              Clientes Más Frecuentes
            </div>
            <div class="card-body">
              <canvas #clientesRadarChart style="height: 350px;"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Tablas de datos detallados -->
      <div class="row">
        <div class="col-xl-6">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-table me-1"></i>
              Análisis Detallado de Productos
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Ingresos</th>
                      <th>Rentabilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let producto of productos">
                      <td>{{ producto.nombre }}</td>
                      <td><span class="badge bg-info">{{ producto.cantidad_vendida }}</span></td>
                      <td>₱ {{ producto.ingresos_totales | number:'1.0-0' }}</td>
                      <td>
                        <div class="progress" style="height: 10px;">
                          <div class="progress-bar bg-success" 
                               [style.width.%]="(producto.ingresos_totales / maxIngresos) * 100">
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-6">
          <div class="card mb-4">
            <div class="card-header">
              <i class="fas fa-star me-1"></i>
              Análisis de Marcas Populares
            </div>
            <div class="card-body">
              <div class="table-responsive">  
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Marca</th>
                      <th>Productos</th>
                      <th>Ventas</th>
                      <th>Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let marca of marcas">
                      <td><strong>{{ marca.marca }}</strong></td>
                      <td><span class="badge bg-primary">{{ marca.productos_vendidos }}</span></td>
                      <td>₱ {{ marca.ingresos_totales | number:'1.0-0' }}</td>
                      <td>
                        <span class="badge bg-success">{{ ((marca.ingresos_totales / getTotalIngresos()) * 100) | number:'1.1-1' }}%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('tendenciasChart') tendenciasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('marcasPieChart') marcasPieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productosBarChart') productosBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('clientesRadarChart') clientesRadarChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  ventas: VentaAnalytics[] = [];
  productos: ProductoVendido[] = [];
  clientes: ClienteFrecuente[] = [];
  marcas: MarcaPopular[] = [];
  
  promedioVentaDiaria: number = 0;
  maxIngresos: number = 0;

  private tendenciasChart!: Chart;
  private marcasPieChart!: Chart;
  private productosBarChart!: Chart;
  private clientesRadarChart!: Chart;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    // Los gráficos se crearán después de cargar los datos
  }

  cargarDatos() {
    // Cargar estadísticas generales desde datos reales
    this.analyticsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.promedioVentaDiaria = stats.ventas_mes / 30;
      }
    });

    // Cargar tendencias de ventas desde datos reales
    this.analyticsService.getVentasPorPeriodo(7).subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        setTimeout(() => this.crearGraficoTendencias(), 0);
      }
    });

    // Cargar productos más vendidos desde datos reales
    this.analyticsService.getProductosMasVendidos().subscribe({
      next: (productos) => {
        this.productos = productos.slice(0, 10);
        this.maxIngresos = Math.max(...productos.map(p => p.ingresos_totales));
        setTimeout(() => this.crearGraficoProductos(), 0);
      }
    });

    // Cargar clientes frecuentes desde datos reales
    this.analyticsService.getClientesFrecuentes().subscribe({
      next: (clientes) => {
        this.clientes = clientes.slice(0, 8);
        setTimeout(() => this.crearGraficoClientes(), 0);
      }
    });

    // Cargar marcas populares desde datos reales
    this.analyticsService.getMarcasPopulares().subscribe({
      next: (marcas) => {
        this.marcas = marcas;
        setTimeout(() => this.crearGraficoMarcasPie(), 0);
      }
    });
  }

  crearGraficoTendencias() {
    if (!this.tendenciasChartRef) return;

    const ctx = this.tendenciasChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.tendenciasChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.ventas.map(v => new Date(v.fecha).toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: '2-digit',
          month: 'short'
        })),
        datasets: [
          {
            label: 'Ventas Diarias ($)',
            data: this.ventas.map(v => v.total),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(75, 192, 192)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          },
          {
            label: 'Promedio Móvil (3 días)',
            data: this.calcularPromedioMovil(this.ventas.map(v => v.total), 3),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.05)',
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evolución de Ventas con Tendencia'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₲ ' + Number(value).toLocaleString('es-PY');
              }
            }
          }
        }
      }
    });
  }

  crearGraficoMarcasPie() {
    if (!this.marcasPieChartRef) return;

    const ctx = this.marcasPieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.marcasPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.marcas.map(m => m.marca),
        datasets: [{
          data: this.marcas.map(m => (m.ingresos_totales / 1000)), // Convertir a miles para el gráfico
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Participación de Mercado por Marca'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  crearGraficoProductos() {
    if (!this.productosBarChartRef) return;

    const ctx = this.productosBarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.productosBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.productos.map(p => p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre),
        datasets: [{
          label: 'Ingresos ($)',
          data: this.productos.map(p => p.ingresos_totales),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Productos con Mayor Facturación'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₲ ' + Number(value).toLocaleString('es-PY');
              }
            }
          }
        }
      }
    });
  }

  crearGraficoClientes() {
    if (!this.clientesRadarChartRef) return;

    const ctx = this.clientesRadarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.clientesRadarChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: this.clientes.map(c => c.nombre),
        datasets: [{
          label: 'Compras Realizadas',
          data: this.clientes.map(c => c.total_compras),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Actividad de Clientes Frecuentes'
          }
        }
      }
    });
  }

  calcularPromedioMovil(datos: number[], periodo: number): number[] {
    const promedios: number[] = [];
    for (let i = 0; i < datos.length; i++) {
      if (i < periodo - 1) {
        promedios.push(datos[i]);
      } else {
        const suma = datos.slice(i - periodo + 1, i + 1).reduce((a, b) => a + b, 0);
        promedios.push(suma / periodo);
      }
    }
    return promedios;
  }

  getTotalIngresos(): number {
    return this.marcas.reduce((total, marca) => total + marca.ingresos_totales, 0);
  }
}
