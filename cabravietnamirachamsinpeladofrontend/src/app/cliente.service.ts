import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteResponse, BusquedaClienteResponse } from './cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private baseUrl = '/api/clientes';

  constructor(private http: HttpClient) {}

  // Obtener todos los clientes con paginacion
  getClientes(filtros: any = {}): Observable<ClienteResponse> {
    let params = new HttpParams();
    
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.tipo_documento) params = params.set('tipo_documento', filtros.tipo_documento);
    if (filtros.activo !== undefined) params = params.set('activo', filtros.activo.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());
    
    return this.http.get<ClienteResponse>(this.baseUrl + '/', { params });
  }

  // Obtener un cliente por ID
  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}/`);
  }

  // Crear nuevo cliente
  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl + '/', cliente);
  }

  // Actualizar cliente existente
  actualizarCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.baseUrl}/${id}/`, cliente);
  }

  // Eliminar cliente
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // ==========================================
  // METODOS PARA AUTOCOMPLETADO EN FACTURACION
  // ==========================================

  // Buscar cliente por numero de documento
  buscarPorDocumento(documento: string): Observable<BusquedaClienteResponse> {
    const params = new HttpParams().set('documento', documento);
    return this.http.get<BusquedaClienteResponse>(
      `${this.baseUrl}/buscar_por_documento/`, 
      { params }
    );
  }

  // Lista para dropdown (sin paginacion)
  getClientesDropdown(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/dropdown/`);
  }

  // Crear cliente desde factura
  crearDesdeFactura(datosCliente: Partial<Cliente>): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear_desde_factura/`, datosCliente);
  }
}
