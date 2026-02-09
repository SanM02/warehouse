import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, VentaAnalytics, ProductoVendido, ClienteFrecuente, MarcaPopular } from './analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Obtener estadísticas del dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      productos: this.http.get<any>(`${this.baseUrl}/productos/`),
      facturas: this.http.get<any>(`${this.baseUrl}/facturas/`),
      movimientos: this.http.get<any>(`${this.baseUrl}/movimientos/`)
    }).pipe(
      map(({ productos, facturas, movimientos }) => {
        const hoy = new Date().toISOString().split('T')[0];
        
        // Calcular estadísticas basadas en datos reales
        const facturasHoy = facturas.results?.filter((f: any) => 
          f.fecha?.startsWith(hoy)
        ) || [];
        
        const ventasHoy = facturasHoy.reduce((sum: number, f: any) => sum + (parseFloat(f.total) || 0), 0);
        
        const facturasEsteMes = facturas.results?.filter((f: any) => {
          const fechaFactura = new Date(f.fecha);
          const fechaActual = new Date();
          return fechaFactura.getMonth() === fechaActual.getMonth() && 
                 fechaFactura.getFullYear() === fechaActual.getFullYear();
        }) || [];
        
        const ventasMes = facturasEsteMes.reduce((sum: number, f: any) => sum + (parseFloat(f.total) || 0), 0);
        
        return {
          ventas_hoy: ventasHoy,
          ventas_mes: ventasMes,
          productos_vendidos_hoy: facturasHoy.length,
          clientes_unicos_mes: new Set(facturasEsteMes.map((f: any) => f.cliente)).size,
          producto_mas_vendido: 'Martillo Stanley', // Esto debería calcularse desde el backend
          marca_mas_popular: 'Stanley'
        };
      })
    );
  }

  // Obtener ventas por período
  getVentasPorPeriodo(dias: number): Observable<VentaAnalytics[]> {
    return this.http.get<any>(`${this.baseUrl}/facturas/`).pipe(
      map((data: any) => {
        const facturas = data.results || [];
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        
        // Agrupar ventas por día
        const ventasPorDia: { [key: string]: VentaAnalytics } = {};
        
        facturas.forEach((factura: any) => {
          const fecha = factura.fecha?.split('T')[0];
          if (fecha && new Date(fecha) >= fechaLimite) {
            if (!ventasPorDia[fecha]) {
              ventasPorDia[fecha] = {
                fecha: fecha,
                total: 0,
                cantidad_productos: 0,
                cliente: ''
              };
            }
            ventasPorDia[fecha].total += factura.total || 0;
            ventasPorDia[fecha].cantidad_productos += 1;
            ventasPorDia[fecha].cliente = factura.cliente || '';
          }
        });
        
        return Object.values(ventasPorDia).sort((a, b) => 
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );
      })
    );
  }

  // Obtener productos más vendidos
  getProductosMasVendidos(): Observable<ProductoVendido[]> {
    return forkJoin({
      productos: this.http.get<any>(`${this.baseUrl}/productos/`),
      facturas: this.http.get<any>(`${this.baseUrl}/facturas/`)
    }).pipe(
      map(({ productos, facturas }) => {
        // Aquí deberías calcular los productos más vendidos basado en los datos reales
        // Por ahora retorno un ejemplo básico
        const productosConVentas = productos.results?.slice(0, 10).map((p: any, index: number) => ({
          id: p.id,
          nombre: p.nombre,
          marca: p.marca,
          cantidad_vendida: Math.floor(Math.random() * 50) + 10,
          ingresos_totales: (p.precio_unitario || 0) * (Math.floor(Math.random() * 50) + 10)
        })) || [];
        
        return productosConVentas.sort((a: any, b: any) => b.ingresos_totales - a.ingresos_totales);
      })
    );
  }

  // Obtener clientes frecuentes
  getClientesFrecuentes(): Observable<ClienteFrecuente[]> {
    return this.http.get<any>(`${this.baseUrl}/facturas/`).pipe(
      map((data: any) => {
        const facturas = data.results || [];
        const clientesMap: { [key: string]: ClienteFrecuente } = {};
        
        facturas.forEach((factura: any) => {
          const cliente = factura.cliente;
          if (cliente) {
            if (!clientesMap[cliente]) {
              clientesMap[cliente] = {
                nombre: cliente,
                total_compras: 0,
                total_gastado: 0,
                ultima_compra: factura.fecha?.split('T')[0] || ''
              };
            }
            clientesMap[cliente].total_compras += 1;
            clientesMap[cliente].total_gastado += factura.total || 0;
            
            // Actualizar última compra si es más reciente
            if (factura.fecha && factura.fecha > clientesMap[cliente].ultima_compra) {
              clientesMap[cliente].ultima_compra = factura.fecha.split('T')[0];
            }
          }
        });
        
        return Object.values(clientesMap)
          .sort((a, b) => b.total_compras - a.total_compras)
          .slice(0, 10);
      })
    );
  }

  // Obtener marcas populares
  getMarcasPopulares(): Observable<MarcaPopular[]> {
    return forkJoin({
      productos: this.http.get<any>(`${this.baseUrl}/productos/`),
      facturas: this.http.get<any>(`${this.baseUrl}/facturas/`)
    }).pipe(
      map(({ productos, facturas }) => {
        const marcasMap: { [key: string]: MarcaPopular } = {};
        
        productos.results?.forEach((producto: any) => {
          const marca = producto.marca;
          if (marca) {
            if (!marcasMap[marca]) {
              marcasMap[marca] = {
                marca: marca,
                productos_vendidos: 0,
                ingresos_totales: 0
              };
            }
            // Simular ventas basadas en stock y precio
            const ventasEstimadas = Math.floor(Math.random() * 20) + 5;
            marcasMap[marca].productos_vendidos += ventasEstimadas;
            marcasMap[marca].ingresos_totales += (producto.precio_unitario || 0) * ventasEstimadas;
          }
        });
        
        return Object.values(marcasMap)
          .sort((a, b) => b.ingresos_totales - a.ingresos_totales)
          .slice(0, 6);
      })
    );
  }
}
