export interface FacturaDetalle {
  producto: number; // ID del producto
  producto_nombre?: string; // Nombre del producto para mostrar
  codigo_producto?: string; // Código del producto
  marca_producto?: string; // Marca del producto
  categoria_producto?: string; // Categoría del producto
  stock_disponible?: number; // Stock disponible al momento de agregar
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
