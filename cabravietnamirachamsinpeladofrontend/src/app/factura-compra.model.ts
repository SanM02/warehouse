export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio_unitario: number;
  stock_disponible: number;
}

export interface DetalleFacturaCompra {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  lote?: string;
  fecha_vencimiento_lote?: string;
}

export interface FacturaCompra {
  id?: number;
  numero_factura: string;
  proveedor: number;
  proveedor_nombre?: string;
  orden_compra?: number;
  orden_compra_numero?: string;
  fecha_emision: string;
  fecha_recepcion?: string;
  fecha_vencimiento?: string;
  tipo_factura: 'contado' | 'credito';
  estado: 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  timbrado?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  detalles: DetalleFacturaCompra[];
  esta_vencida?: boolean;
  dias_para_vencimiento?: number;
}

export interface FacturaCompraList {
  id: number;
  numero_factura: string;
  proveedor_nombre: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  tipo_factura: string;
  estado: string;
  total: number;
  esta_vencida: boolean;
}

export interface EstadisticasFacturasCompra {
  total_facturas: number;
  facturas_pendientes: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  monto_total_pendiente: number;
  monto_total_pagado: number;
  promedio_dias_vencimiento: number;
}
