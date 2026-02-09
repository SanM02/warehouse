import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleOrdenCompra {
  id?: number;
  producto: number;
  producto_nombre?: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: string;
  subtotal: string;
  cantidad_pendiente: number;
  esta_completo: boolean;
}

export interface OrdenCompra {
  id?: number;
  numero_orden?: string;
  proveedor: number;
  proveedor_nombre?: string;
  fecha_orden?: string;
  fecha_esperada: string;
  estado: 'pendiente' | 'parcial' | 'completa' | 'cancelada';
  total_estimado?: string;
  observaciones?: string;
  usuario?: number;
  detalles: DetalleOrdenCompra[];
}

export interface OrdenCompraResponse {
  count: number;
  next?: string;
  previous?: string;
  results: OrdenCompra[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private apiUrl = 'http://localhost:8000/api/ordenes-compra/';

  constructor(private http: HttpClient) {}

  // Obtener órdenes con paginación y filtros
  getOrdenes(params?: any): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(this.apiUrl, { params });
  }

  // Obtener orden por ID
  getOrden(id: number): Observable<OrdenCompra> {
    return this.http.get<OrdenCompra>(`${this.apiUrl}${id}/`);
  }

  // Crear nueva orden de compra
  crearOrden(orden: OrdenCompra): Observable<OrdenCompra> {
    return this.http.post<OrdenCompra>(this.apiUrl, orden);
  }

  // Actualizar orden de compra
  actualizarOrden(id: number, orden: OrdenCompra): Observable<OrdenCompra> {
    return this.http.put<OrdenCompra>(`${this.apiUrl}${id}/`, orden);
  }

  // Cancelar orden de compra
  cancelarOrden(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}${id}/`, { estado: 'cancelada' });
  }

  // Filtrar órdenes por proveedor
  getOrdenesPorProveedor(proveedorId: number): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(`${this.apiUrl}?proveedor=${proveedorId}`);
  }

  // Filtrar órdenes por estado
  getOrdenesPorEstado(estado: string): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(`${this.apiUrl}?estado=${estado}`);
  }

  // Obtener órdenes pendientes
  getOrdenesPendientes(): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(`${this.apiUrl}?estado=pendiente`);
  }

  // Obtener órdenes por rango de fechas
  getOrdenesPorFecha(fechaInicio: string, fechaFin: string): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(`${this.apiUrl}?fecha_orden__gte=${fechaInicio}&fecha_orden__lte=${fechaFin}`);
  }
}
