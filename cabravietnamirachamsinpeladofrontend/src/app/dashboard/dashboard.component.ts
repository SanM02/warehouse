import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../analytics.service';
import { ApiService } from '../api.service';
import { DashboardStats, VentaAnalytics, ProductoVendido, ClienteFrecuente, MarcaPopular } from '../analytics.model';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'] 
})
export class DashboardComponent implements OnInit {

  stats: DashboardStats | null = null;
  ventas: VentaAnalytics[] = [];
  productos: ProductoVendido[] = [];
  clientes: ClienteFrecuente[] = [];
  marcas: MarcaPopular[] = [];
  

  ventasHoy: number = 0;
  ventasMes: number = 0;
  facturasDia: number = 0;
  promedioVenta: number = 0;
  stockAlto: number = 0;
  stockMedio: number = 0;
  stockBajo: number = 0;
  maxIngresosMarca: number = 0;

  constructor(
    private analyticsService: AnalyticsService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Cargar estadísticas del dashboard desde datos reales
    this.analyticsService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.stats = stats;
        // Usar los datos reales del backend y asegurar que sean números
        this.ventasHoy = parseFloat(stats.ventas_hoy?.toString()) || 0;
        this.ventasMes = parseFloat(stats.ventas_mes?.toString()) || 0;
        this.facturasDia = parseInt(stats.productos_vendidos_hoy?.toString()) || 0;
        this.promedioVenta = this.ventasMes > 0 && this.facturasDia > 0 
          ? Math.round(this.ventasMes / this.facturasDia) 
          : 0;
      }
    });

    // Cargar ventas de la última semana desde datos reales
    this.analyticsService.getVentasPorPeriodo(7).subscribe({
      next: (ventas: VentaAnalytics[]) => {
        this.ventas = ventas;
      }
    });

    // Cargar productos más vendidos desde datos reales
    this.analyticsService.getProductosMasVendidos().subscribe({
      next: (productos: ProductoVendido[]) => {
        this.productos = productos.slice(0, 5);
      }
    });

    // Cargar clientes frecuentes desde datos reales
    this.analyticsService.getClientesFrecuentes().subscribe({
      next: (clientes: ClienteFrecuente[]) => {
        this.clientes = clientes.slice(0, 5);
      }
    });

    // Cargar marcas populares desde datos reales
    this.analyticsService.getMarcasPopulares().subscribe({
      next: (marcas: MarcaPopular[]) => {
        this.marcas = marcas.slice(0, 5);
        this.maxIngresosMarca = marcas.length > 0 
          ? Math.max(...marcas.map(m => m.ingresos_totales)) 
          : 0;
      }
    });

    // Cargar datos de inventario desde el backend
    this.cargarDatosInventario();
  }

  cargarDatosInventario() {
    // Obtener productos del backend para calcular niveles de stock
    this.apiService.getProductos().subscribe({
      next: (productos: any[]) => {
        if (productos && productos.length > 0) {
          // Calcular niveles de stock basados en datos reales
          this.stockAlto = productos.filter(p => p.stock_disponible > 50).length;
          this.stockMedio = productos.filter(p => p.stock_disponible >= 10 && p.stock_disponible <= 50).length;
          this.stockBajo = productos.filter(p => p.stock_disponible < 10).length;
        } else {
          // Valores por defecto si no hay productos
          this.stockAlto = 0;
          this.stockMedio = 0;
          this.stockBajo = 0;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar datos de inventario:', error);
        // Valores por defecto en caso de error
        this.stockAlto = 0;
        this.stockMedio = 0;
        this.stockBajo = 0;
      }
    });
  }

  trackByProducto(index: number, item: ProductoVendido): number {
    return item.nombre ? item.nombre.length : index;
  }

  trackByMarca(index: number, item: MarcaPopular): number {
    return item.marca ? item.marca.length : index;
  }

}
