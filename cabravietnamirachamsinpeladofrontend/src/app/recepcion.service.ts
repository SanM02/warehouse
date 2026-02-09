import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Recepcion {
  id?: number;
  orden_compra: number;
  orden_compra_numero?: string;
  fecha_recepcion?: string;
  usuario_recibe?: string;
  observaciones?: string;
  estado?: 'completa' | 'parcial';
  detalles: DetalleRecepcion[];
  numero_recepcion?: string;
  total_recibido?: string;
}

export interface DetalleRecepcion {
  id?: number;
  recepcion?: number;
  detalle_orden: number;
  producto?: number;
  producto_nombre?: string;
  cantidad_recibida: number;
  cantidad_solicitada?: number;
  precio_unitario?: string;
  subtotal?: string;
  observaciones?: string;
}

export interface RecepcionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Recepcion[];
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionService {
  private baseUrl = 'http://localhost:8000/api/recepciones';

  constructor(private http: HttpClient) {}

  // Obtener todas las recepciones con filtros opcionales
  getRecepciones(filtros: any = {}): Observable<RecepcionResponse> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.set(key, filtros[key].toString());
      }
    });

    return this.http.get<RecepcionResponse>(this.baseUrl + '/', { params });
  }

  // Obtener recepción por ID
  getRecepcion(id: number): Observable<Recepcion> {
    return this.http.get<Recepcion>(`${this.baseUrl}/${id}/`);
  }

  // Crear nueva recepción
  crearRecepcion(recepcion: Recepcion): Observable<Recepcion> {
    return this.http.post<Recepcion>(this.baseUrl + '/', recepcion);
  }

  // Actualizar recepción existente
  actualizarRecepcion(id: number, recepcion: Partial<Recepcion>): Observable<Recepcion> {
    return this.http.put<Recepcion>(`${this.baseUrl}/${id}/`, recepcion);
  }

  // Eliminar recepción
  eliminarRecepcion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  // Obtener órdenes de compra pendientes o parciales para recibir
  getOrdenesPendientes(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8000/api/ordenes-compra/', {
      params: { estado__in: 'pendiente,parcial' }
    });
  }

  // Obtener detalles de una orden de compra para crear recepción
  getDetallesOrden(ordenId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:8000/api/ordenes-compra/${ordenId}/`);
  }

  // Procesar recepción automática (actualiza stock y estado de orden)
  procesarRecepcionAutomatica(recepcion: Recepcion): Observable<any> {
    // Usar el endpoint estándar de creación ya que procesar-automatica no existe
    console.log('📦 Creando recepción mediante endpoint estándar:', recepcion);
    return this.crearRecepcion(recepcion);
  }

  // Obtener recepciones por orden de compra
  getRecepcionesPorOrden(ordenId: number): Observable<Recepcion[]> {
    return this.http.get<Recepcion[]>(this.baseUrl + '/', {
      params: { orden_compra: ordenId.toString() }
    }).pipe(
      // Extraer solo los resultados del response paginado
      // En el componente manejaremos la paginación completa si es necesario
    );
  }

  // Filtrar recepciones por rango de fechas
  getRecepcionesPorFecha(fechaInicio: string, fechaFin: string): Observable<RecepcionResponse> {
    return this.http.get<RecepcionResponse>(this.baseUrl + '/', {
      params: {
        fecha_recepcion__gte: fechaInicio,
        fecha_recepcion__lte: fechaFin
      }
    });
  }

  // Obtener recepciones por usuario
  getRecepcionesPorUsuario(usuario: string): Observable<RecepcionResponse> {
    return this.http.get<RecepcionResponse>(this.baseUrl + '/', {
      params: { usuario_recibe: usuario }
    });
  }

  // Obtener estadísticas de recepciones
  getEstadisticasRecepciones(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/estadisticas/`);
  }

  // Marcar recepción como completa
  marcarCompleta(id: number): Observable<Recepcion> {
    return this.http.patch<Recepcion>(`${this.baseUrl}/${id}/`, { estado: 'completa' });
  }

  // Validar cantidades antes de procesar
  validarCantidades(recepcion: Recepcion): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (!recepcion.detalles || recepcion.detalles.length === 0) {
      errores.push('Debe agregar al menos un producto a la recepción');
    }

    recepcion.detalles.forEach((detalle, index) => {
      if (!detalle.cantidad_recibida || detalle.cantidad_recibida <= 0) {
        errores.push(`La cantidad recibida del producto ${detalle.producto_nombre} debe ser mayor a 0`);
      }

      if (detalle.cantidad_solicitada && detalle.cantidad_recibida > detalle.cantidad_solicitada) {
        errores.push(`La cantidad recibida del producto ${detalle.producto_nombre} no puede ser mayor a la solicitada`);
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // Actualizar estado de una orden de compra
  actualizarEstadoOrden(ordenId: number, estado: string): Observable<any> {
    return this.http.patch<any>(`http://localhost:8000/api/ordenes-compra/${ordenId}/`, { estado });
  }
}
