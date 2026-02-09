import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proveedor {
  id?: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  contacto: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface ProveedorResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Proveedor[];
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = 'http://localhost:8000/api/proveedores/';

  constructor(private http: HttpClient) {}

  // Obtener proveedores con paginación y filtros
  getProveedores(params?: any): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(this.apiUrl, { params });
  }

  // Obtener proveedor por ID
  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}${id}/`);
  }

  // Crear nuevo proveedor
  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  // Actualizar proveedor
  actualizarProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}${id}/`, proveedor);
  }

  // Eliminar proveedor (cambiar activo a false)
  eliminarProveedor(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}${id}/`, { activo: false });
  }

  // Buscar proveedores
  buscarProveedores(query: string): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}?search=${query}`);
  }

  // Filtrar por activos
  getProveedoresActivos(): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}?activo=true`);
  }
}
