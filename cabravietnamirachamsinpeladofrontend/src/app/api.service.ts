// ...existing code...

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:8000/api/productos/';
  private authUrl = 'http://localhost:8000/api/token/';
  private facturasUrl = 'http://localhost:8000/api/facturas/';
  
  login(username: string, password: string) {
    return this.http.post<any>(this.authUrl, { username, password });
  }

  constructor(private http: HttpClient) {}

  getMovimientos(filtros: any = {}) {
    let params = [];
    if (filtros.producto) params.push(`producto=${filtros.producto}`);
    if (filtros.tipo) params.push(`tipo=${filtros.tipo}`);
    if (filtros.usuario) params.push(`usuario=${filtros.usuario}`);
    if (filtros.fecha) params.push(`fecha=${filtros.fecha}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.http.get<any>(`http://localhost:8000/api/movimientos/${query}`);
  }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProductosPagina(url: string) {
    return this.http.get<any>(url);
  }

  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

  actualizarStock(id: number, nuevoStock: number) {
    // Ahora usa el id numérico
    return this.http.patch<any>(`${this.apiUrl}${id}/`, { stock_disponible: nuevoStock });
  }

  // Actualizar producto completo
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${id}/`, producto);
  }

  // Eliminar producto
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${id}/`);
  }

  // Crear una nueva factura
  crearFactura(factura: any): Observable<any> {
    return this.http.post<any>(this.facturasUrl, factura);
  }

  // Obtener todas las facturas
  getFacturas(): Observable<any[]> {
    return this.http.get<any[]>(this.facturasUrl);
  }

  // Obtener factura por ID
  getFactura(id: number): Observable<any> {
    return this.http.get<any>(`${this.facturasUrl}${id}/`);
  }

  // Obtener datos completos de factura para PDF
  getDatosCompletosFactura(id: number): Observable<any> {
    return this.http.get<any>(`${this.facturasUrl}${id}/datos_completos/`);
  }

  // Actualizar factura
  actualizarFactura(id: number, factura: any): Observable<any> {
    return this.http.put<any>(`${this.facturasUrl}${id}/`, factura);
  }

  // Eliminar factura
  eliminarFactura(id: number): Observable<any> {
    return this.http.delete<any>(`${this.facturasUrl}${id}/`);
  }

  // ==========================================
  // ENDPOINTS PARA DROPDOWNS (SIN PAGINACION)
  // ==========================================

  // Obtener TODOS los productos para dropdowns (sin paginacion)
  getProductosDropdown(): Observable<any[]> {
    return this.http.get<any[]>('/api/productos/dropdown/');
  }
  
  // Obtener TODOS los proveedores para dropdowns
  getProveedoresDropdown(): Observable<any[]> {
    return this.http.get<any[]>('/api/proveedores/dropdown/');
  }
}
