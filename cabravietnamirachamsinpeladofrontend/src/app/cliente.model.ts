export interface Cliente {
  id?: number;
  tipo_documento: 'ninguno' | 'cedula' | 'ruc';
  numero_documento: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
  fecha_registro?: string;
  fecha_actualizacion?: string;
  total_compras?: number;
  monto_total_compras?: number;
}

export interface ClienteResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
}

export interface BusquedaClienteResponse {
  encontrado: boolean;
  cliente?: Cliente;
  mensaje?: string;
}
