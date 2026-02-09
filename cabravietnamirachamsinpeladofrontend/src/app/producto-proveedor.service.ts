import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoProveedor {
  id?: number;
  producto: number;
  producto_nombre?: string;
  proveedor: number;
  proveedor_nombre?: string;
  precio_compra: string;
  es_principal: boolean;
  tiempo_entrega_dias: number;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ProductoProveedorResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductoProveedor[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductoProveedorService {
  private baseUrl = 'http://localhost:8000/api/producto-proveedores';

  constructor(private http: HttpClient) {}

  // Obtener todas las relaciones producto-proveedor con filtros
  getProductoProveedores(filtros: any = {}): Observable<ProductoProveedorResponse> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.set(key, filtros[key].toString());
      }
    });

    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', { params });
  }

  // Obtener relación específica por ID
  getProductoProveedor(id: number): Observable<ProductoProveedor> {
    return this.http.get<ProductoProveedor>(`${this.baseUrl}/${id}/`);
  }

  // Crear nueva relación producto-proveedor
  crearProductoProveedor(productoProveedor: ProductoProveedor): Observable<ProductoProveedor> {
    return this.http.post<ProductoProveedor>(this.baseUrl + '/', productoProveedor);
  }

  // Actualizar relación existente
  actualizarProductoProveedor(id: number, productoProveedor: Partial<ProductoProveedor>): Observable<ProductoProveedor> {
    return this.http.put<ProductoProveedor>(`${this.baseUrl}/${id}/`, productoProveedor);
  }

  // Eliminar relación
  eliminarProductoProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // Obtener todos los proveedores de un producto específico
  getProveedoresPorProducto(productoId: number): Observable<ProductoProveedorResponse> {
    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', {
      params: { producto: productoId.toString() }
    });
  }

  // Obtener todos los productos de un proveedor específico
  getProductosPorProveedor(proveedorId: number): Observable<ProductoProveedorResponse> {
    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', {
      params: { proveedor: proveedorId.toString() }
    });
  }

  // Obtener solo proveedores principales
  getProveedoresPrincipales(): Observable<ProductoProveedorResponse> {
    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', {
      params: { es_principal: 'true', activo: 'true' }
    });
  }

  // Obtener solo relaciones activas
  getRelacionesActivas(): Observable<ProductoProveedorResponse> {
    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', {
      params: { activo: 'true' }
    });
  }

  // Marcar proveedor como principal para un producto
  marcarComoPrincipal(id: number): Observable<ProductoProveedor> {
    return this.http.patch<ProductoProveedor>(`${this.baseUrl}/${id}/`, { es_principal: true });
  }

  // Desactivar relación
  desactivarRelacion(id: number): Observable<ProductoProveedor> {
    return this.http.patch<ProductoProveedor>(`${this.baseUrl}/${id}/`, { activo: false });
  }

  // Activar relación
  activarRelacion(id: number): Observable<ProductoProveedor> {
    return this.http.patch<ProductoProveedor>(`${this.baseUrl}/${id}/`, { activo: true });
  }

  // Obtener el mejor precio para un producto (proveedor más barato activo)
  getMejorPrecio(productoId: number): Observable<ProductoProveedor | null> {
    return this.http.get<ProductoProveedor | null>(`${this.baseUrl}/mejor-precio/`, {
      params: { producto: productoId.toString() }
    });
  }

  // Obtener estadísticas de proveedores por producto
  getEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/estadisticas/`);
  }

  // Validar nueva relación (evitar duplicados)
  validarRelacion(productoId: number, proveedorId: number): Observable<{ existe: boolean; mensaje: string }> {
    return this.http.get<{ existe: boolean; mensaje: string }>(`${this.baseUrl}/validar/`, {
      params: { 
        producto: productoId.toString(),
        proveedor: proveedorId.toString()
      }
    });
  }

  // Buscar por término (producto o proveedor)
  buscar(termino: string): Observable<ProductoProveedorResponse> {
    return this.http.get<ProductoProveedorResponse>(this.baseUrl + '/', {
      params: { search: termino }
    });
  }

  // Obtener tiempos de entrega promedio
  getTiemposEntrega(): Observable<{ [key: number]: number }> {
    return this.http.get<{ [key: number]: number }>(`${this.baseUrl}/tiempos-entrega/`);
  }

  // Validar si un producto ya tiene un proveedor principal
  validarProveedorPrincipal(productoId: number): Observable<{ tieneProveedorPrincipal: boolean; proveedor?: ProductoProveedor }> {
    return new Observable(observer => {
      this.getProductoProveedores({ producto: productoId, es_principal: true }).subscribe({
        next: (response) => {
          const proveedor = response.results.length > 0 ? response.results[0] : null;
          observer.next({
            tieneProveedorPrincipal: !!proveedor,
            proveedor: proveedor || undefined
          });
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Establecer proveedor como principal
  establecerProveedorPrincipal(productoProveedorId: number): Observable<ProductoProveedor> {
    return this.http.patch<ProductoProveedor>(`${this.baseUrl}/${productoProveedorId}/`, {
      es_principal: true
    });
  }

  // Asignar múltiples proveedores a un producto
  asignarMultiplesProveedores(productoId: number, proveedores: Partial<ProductoProveedor>[]): Observable<ProductoProveedor[]> {
    const requests = proveedores.map(proveedor => {
      return this.crearProductoProveedor({
        ...proveedor,
        producto: productoId,
        precio_compra: proveedor.precio_compra || '0.00',
        es_principal: proveedor.es_principal || false,
        tiempo_entrega_dias: proveedor.tiempo_entrega_dias || 7,
        activo: true
      } as ProductoProveedor);
    });

    // Ejecutar todas las requests en paralelo
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          observer.next(results as ProductoProveedor[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}
