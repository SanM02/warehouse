export interface VentaAnalytics {
  fecha: string;
  total: number;
  cantidad_productos: number;
  cliente: string;
}

export interface ProductoVendido {
  id: number;
  nombre: string;
  marca: string;
  cantidad_vendida: number;
  ingresos_totales: number;
}

export interface ClienteFrecuente {
  nombre: string;
  total_compras: number;
  total_gastado: number;
  ultima_compra: string;
}

export interface MarcaPopular {
  marca: string;
  productos_vendidos: number;
  ingresos_totales: number;
}

export interface DashboardStats {
  ventas_hoy: number;
  ventas_mes: number;
  productos_vendidos_hoy: number;
  clientes_unicos_mes: number;
  producto_mas_vendido: string;
  marca_mas_popular: string;
}
