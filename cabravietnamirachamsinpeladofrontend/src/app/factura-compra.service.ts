import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaCompra, FacturaCompraList, EstadisticasFacturasCompra } from './factura-compra.model';

@Injectable({
  providedIn: 'root'
})
export class FacturaCompraService {
  private apiUrl = 'http://localhost:8000/api/facturas-compra';

  constructor(private http: HttpClient) {}

  getFacturasCompra(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<any>(this.apiUrl + '/', { params: httpParams });
  }

  getFacturaCompra(id: number): Observable<FacturaCompra> {
    return this.http.get<FacturaCompra>(`${this.apiUrl}/${id}/`);
  }

  createFacturaCompra(factura: FacturaCompra): Observable<FacturaCompra> {
    return this.http.post<FacturaCompra>(this.apiUrl + '/', factura);
  }

  updateFacturaCompra(id: number, factura: FacturaCompra): Observable<FacturaCompra> {
    return this.http.put<FacturaCompra>(`${this.apiUrl}/${id}/`, factura);
  }

  deleteFacturaCompra(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`);
  }

  marcarPagada(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/marcar_pagada/`, {});
  }

  cancelar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/cancelar/`, {});
  }

  getEstadisticas(): Observable<EstadisticasFacturasCompra> {
    return this.http.get<EstadisticasFacturasCompra>(`${this.apiUrl}/estadisticas/`);
  }

  getFacturasVencidas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?vencidas=true`);
  }

  getFacturasProximasVencer(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?proximas_vencer=true`);
  }

  // Métodos de búsqueda y filtrado
  buscarFacturas(query: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?search=${query}`);
  }

  filtrarPorProveedor(proveedorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?proveedor=${proveedorId}`);
  }

  filtrarPorEstado(estado: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?estado=${estado}`);
  }

  filtrarPorTipo(tipo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?tipo_factura=${tipo}`);
  }

  filtrarPorFechaEmision(fechaInicio: string, fechaFin: string): Observable<any> {
    let params = new HttpParams()
      .set('fecha_emision__gte', fechaInicio)
      .set('fecha_emision__lte', fechaFin);
    
    return this.http.get<any>(this.apiUrl + '/', { params });
  }

  filtrarPorFechaVencimiento(fechaInicio: string, fechaFin: string): Observable<any> {
    let params = new HttpParams()
      .set('fecha_vencimiento__gte', fechaInicio)
      .set('fecha_vencimiento__lte', fechaFin);
    
    return this.http.get<any>(this.apiUrl + '/', { params });
  }
}
