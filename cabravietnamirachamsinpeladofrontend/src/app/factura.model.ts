export interface FacturaDetalle {
  producto: number; // ID del producto
  producto_nombre?: string; // Nombre del producto para mostrar
  codigo_producto?: string; // Código del producto
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Factura {
  id?: number;
  cliente: string;
  fecha?: string;
  total?: number;
  detalles: FacturaDetalle[];
}
