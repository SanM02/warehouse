import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecepcionService, Recepcion, DetalleRecepcion, RecepcionResponse } from './recepcion.service';
import { OrdenCompraService, OrdenCompra } from './orden-compra.service';
import { SweetAlertService } from './sweetalert.service';

@Component({
  selector: 'app-recepciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recepciones.component.html',
  styleUrls: ['./recepciones.component.scss']
})
export class RecepcionesComponent implements OnInit {
  recepciones: Recepcion[] = [];
  ordenesPendientes: OrdenCompra[] = [];
  
  mostrarModal = false;
  mostrarModalDetalles = false;
  cargando = false;
  procesandoRecepcion = false;
  
  // Filtros
  filtroOrden: number | null = null;
  fechaInicio = '';
  fechaFin = '';
  filtroUsuario = '';
  
  // Paginación
  totalRecepciones = 0;
  
  // Nueva recepción
  nuevaRecepcion: Recepcion = {
    orden_compra: 0,
    observaciones: '',
    detalles: []
  };

  // Orden seleccionada para recepción
  ordenSeleccionada: OrdenCompra | null = null;
  recepcionSeleccionada: Recepcion | null = null;

  constructor(
    private recepcionService: RecepcionService,
    private ordenService: OrdenCompraService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit() {
    console.log('🚀 Inicializando componente Recepciones...');
    this.cargarRecepciones();
    this.cargarOrdenesPendientes();
    console.log('✅ Componente Recepciones inicializado');
  }

  cargarRecepciones() {
    this.cargando = true;
    const params: any = {};
    
    if (this.filtroOrden) {
      params.orden_compra = this.filtroOrden;
    }
    
    if (this.filtroUsuario) {
      params.usuario_recibe__icontains = this.filtroUsuario;
    }
    
    if (this.fechaInicio && this.fechaFin) {
      params.fecha_recepcion__gte = this.fechaInicio;
      params.fecha_recepcion__lte = this.fechaFin;
    }

    this.recepcionService.getRecepciones(params).subscribe({
      next: (response: RecepcionResponse) => {
        console.log('📨 Recepciones recibidas:', response);
        
        // Validar que response tenga results
        if (response && Array.isArray(response.results)) {
          this.recepciones = response.results;
          this.totalRecepciones = response.count || 0;
        } else {
          console.warn('⚠️ Response de recepciones no válido');
          this.recepciones = [];
          this.totalRecepciones = 0;
        }
        
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar recepciones:', error);
        this.sweetAlert.error('Error al cargar recepciones');
        this.cargando = false;
      }
    });
  }

  cargarOrdenesPendientes() {
    this.recepcionService.getOrdenesPendientes().subscribe({
      next: (response) => {
        console.log('📋 Órdenes pendientes recibidas:', response);
        
        // Validar que la respuesta sea válida
        if (Array.isArray(response)) {
          this.ordenesPendientes = response;
        } else if (response && typeof response === 'object' && Array.isArray((response as any).results)) {
          // Si viene paginado
          this.ordenesPendientes = (response as any).results;
        } else {
          console.warn('⚠️ Response de órdenes pendientes no válido');
          this.ordenesPendientes = [];
        }
        
        console.log('📋 Órdenes pendientes procesadas:', this.ordenesPendientes.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar órdenes pendientes:', error);
        this.ordenesPendientes = [];
      }
    });
  }

  aplicarFiltros() {
    this.cargarRecepciones();
  }

  limpiarFiltros() {
    this.filtroOrden = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroUsuario = '';
    this.cargarRecepciones();
  }

  abrirModalNueva() {
    console.log('🔍 Abriendo modal nueva recepción...');
    
    this.nuevaRecepcion = {
      orden_compra: 0,
      observaciones: '',
      detalles: []
    };
    this.ordenSeleccionada = null;
    this.mostrarModal = true;
    
    console.log('✅ Modal de recepción abierto');
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.mostrarModalDetalles = false;
  }

  async seleccionarOrden() {
    if (!this.nuevaRecepcion.orden_compra) {
      return;
    }

    this.cargando = true;
    
    try {
      const orden = await this.recepcionService.getDetallesOrden(this.nuevaRecepcion.orden_compra).toPromise();
      this.ordenSeleccionada = orden;
      
      // Inicializar detalles de recepción basados en la orden
      if (orden.detalles && Array.isArray(orden.detalles)) {
        this.nuevaRecepcion.detalles = orden.detalles.map((detalle: any) => ({
          detalle_orden: detalle.id,
          producto: detalle.producto,
          producto_nombre: detalle.producto_nombre,
          cantidad_recibida: detalle.cantidad_pendiente || detalle.cantidad_solicitada || 0, // Recibir todo por defecto
          cantidad_solicitada: detalle.cantidad_pendiente || detalle.cantidad_solicitada,
          precio_unitario: detalle.precio_unitario,
          observaciones: ''
        }));
        
        console.log('📦 Detalles inicializados:', this.nuevaRecepcion.detalles);
      } else {
        console.warn('⚠️ La orden no tiene detalles válidos');
        this.nuevaRecepcion.detalles = [];
      }
      
      this.cargando = false;
    } catch (error) {
      console.error('Error al cargar orden:', error);
      this.sweetAlert.error('Error al cargar detalles de la orden');
      
      // Asegurar que detalles sea un array vacío en caso de error
      this.nuevaRecepcion.detalles = [];
      this.ordenSeleccionada = null;
      
      this.cargando = false;
    }
  }

  actualizarSubtotal(detalle: DetalleRecepcion) {
    const precio = parseFloat(detalle.precio_unitario || '0');
    const cantidad = detalle.cantidad_recibida || 0;
    detalle.subtotal = (precio * cantidad).toString();
  }

  calcularTotalRecibido() {
    if (!this.nuevaRecepcion.detalles) return '0.00';
    
    const total = this.nuevaRecepcion.detalles.reduce((sum, detalle) => {
      return sum + parseFloat(detalle.subtotal || '0');
    }, 0);
    
    this.nuevaRecepcion.total_recibido = total.toString();
    return total.toFixed(2);
  }

  async procesarRecepcion() {
    // Validar recepción
    const validacion = this.recepcionService.validarCantidades(this.nuevaRecepcion);
    if (!validacion.valido) {
      this.sweetAlert.error('Errores de validación:', validacion.errores.join('\n'));
      return;
    }

    // Confirmar procesamiento
    const confirmacion = await this.sweetAlert.confirm(
      '¿Procesar esta recepción?',
      'Se actualizará automáticamente el inventario y el estado de la orden de compra'
    );

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesandoRecepcion = true;

    // Calcular subtotales antes de enviar
    this.nuevaRecepcion.detalles.forEach(detalle => {
      this.actualizarSubtotal(detalle);
    });

    this.calcularTotalRecibido();

    // Calcular total recibido
    const totalRecibido = this.nuevaRecepcion.detalles.reduce((sum, detalle) => {
      const precio = parseFloat((detalle.precio_unitario || '0').toString());
      const cantidad = parseInt(detalle.cantidad_recibida.toString());
      return sum + (precio * cantidad);
    }, 0);

    // Obtener usuario del localStorage
    const usuario = localStorage.getItem('username') || 'Usuario';

    // Preparar datos para envío
    const recepcionParaEnviar = {
      numero_recepcion: `REC-${Date.now()}`, // Generar número de recepción
      orden_compra: parseInt(this.nuevaRecepcion.orden_compra.toString()),
      proveedor: this.ordenSeleccionada?.proveedor || this.obtenerProveedorDeOrdenPendiente(this.nuevaRecepcion.orden_compra), // Obtener proveedor
      usuario_recibe: usuario,
      total_recibido: totalRecibido.toFixed(2),
      observaciones: this.nuevaRecepcion.observaciones || '',
      detalles: this.nuevaRecepcion.detalles.map(detalle => ({
        detalle_orden: detalle.detalle_orden,
        producto: parseInt((detalle.producto || 0).toString()),
        cantidad_recibida: parseInt(detalle.cantidad_recibida.toString()),
        precio_unitario: parseFloat((detalle.precio_unitario || '0').toString()),
        observaciones: detalle.observaciones || ''
      }))
    };

    // Validar que se tenga proveedor
    if (!recepcionParaEnviar.proveedor) {
      this.sweetAlert.error('No se pudo determinar el proveedor de la orden');
      this.procesandoRecepcion = false;
      return;
    }

    console.log('📤 Enviando recepción al backend:', recepcionParaEnviar);

    // Procesar recepción
    this.recepcionService.procesarRecepcionAutomatica(recepcionParaEnviar as any).subscribe({
      next: (response) => {
        console.log('✅ Recepción procesada exitosamente:', response);
        
        // Actualizar estado de la orden después de la recepción
        this.actualizarEstadoOrden(this.nuevaRecepcion.orden_compra);
        
        this.sweetAlert.success(
          'Recepción procesada exitosamente',
          'El inventario y la orden han sido actualizados'
        );
        this.cerrarModal();
        this.cargarRecepciones();
        this.cargarOrdenesPendientes();
        this.procesandoRecepcion = false;
      },
      error: (error) => {
        console.error('❌ Error al procesar recepción:', error);
        console.error('❌ Error details:', error.error);
        
        let mensajeError = 'Error al procesar recepción';
        
        if (error.error && typeof error.error === 'object') {
          const errores = Object.keys(error.error).map(campo => {
            const mensajes = Array.isArray(error.error[campo]) ? error.error[campo] : [error.error[campo]];
            return `${campo}: ${mensajes.join(', ')}`;
          });
          mensajeError = `Errores de validación:\n${errores.join('\n')}`;
        }
        
        this.sweetAlert.error(mensajeError);
        this.procesandoRecepcion = false;
      }
    });
  }

  verDetalles(recepcion: Recepcion) {
    this.recepcionSeleccionada = recepcion;
    this.mostrarModalDetalles = true;
  }

  async eliminarRecepcion(recepcion: Recepcion) {
    const confirmacion = await this.sweetAlert.confirm(
      `¿Eliminar la recepción ${recepcion.numero_recepcion}?`,
      'Esta acción no se puede deshacer y puede afectar el inventario'
    );

    if (confirmacion.isConfirmed && recepcion.id) {
      this.recepcionService.eliminarRecepcion(recepcion.id).subscribe({
        next: () => {
          this.sweetAlert.success('Recepción eliminada exitosamente');
          this.cargarRecepciones();
        },
        error: (error) => {
          console.error('Error al eliminar recepción:', error);
          this.sweetAlert.error('Error al eliminar recepción');
        }
      });
    }
  }

  obtenerNombreOrden(ordenId: number): string {
    const orden = this.ordenesPendientes.find(o => o.id === ordenId);
    return orden ? orden.numero_orden || `Orden #${ordenId}` : `Orden #${ordenId}`;
  }

  obtenerEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'completa': 'bg-success',
      'parcial': 'bg-warning'
    };
    return badges[estado] || 'bg-secondary';
  }

  // Validar que la cantidad recibida no exceda la pendiente
  validarCantidad(detalle: DetalleRecepcion) {
    if (detalle.cantidad_recibida > (detalle.cantidad_solicitada || 0)) {
      detalle.cantidad_recibida = detalle.cantidad_solicitada || 0;
      this.sweetAlert.error('La cantidad recibida no puede exceder la cantidad pendiente');
    }
    this.actualizarSubtotal(detalle);
  }

  trackByRecepcion(index: number, recepcion: Recepcion): number {
    return recepcion.id || index;
  }

  trackByDetalle(index: number, detalle: DetalleRecepcion): number {
    return detalle.id || index;
  }

  // Obtener proveedor de la orden pendiente
  obtenerProveedorDeOrdenPendiente(ordenId: number): number | undefined {
    const orden = this.ordenesPendientes.find(o => o.id === ordenId);
    return orden ? orden.proveedor : undefined;
  }

  // Actualizar estado de la orden después de la recepción
  actualizarEstadoOrden(ordenId: number) {
    // Verificar si la orden está completamente recibida
    this.ordenService.getOrden(ordenId).subscribe({
      next: (orden) => {
        console.log('📋 Verificando estado de orden:', orden);
        
        // Calcular si todos los productos están completamente recibidos
        const todosCompletos = orden.detalles.every(detalle => 
          detalle.cantidad_recibida >= detalle.cantidad_solicitada
        );
        
        const algunosRecibidos = orden.detalles.some(detalle => 
          detalle.cantidad_recibida > 0
        );

        let nuevoEstado: 'pendiente' | 'parcial' | 'completa' | 'cancelada' = 'pendiente';
        if (todosCompletos) {
          nuevoEstado = 'completa';
        } else if (algunosRecibidos) {
          nuevoEstado = 'parcial';
        }

        // Actualizar estado si cambió
        if (nuevoEstado !== orden.estado) {
          // Usar una actualización HTTP directa para solo cambiar el estado
          this.recepcionService.actualizarEstadoOrden(ordenId, nuevoEstado).subscribe({
            next: (ordenActualizada: any) => {
              console.log(`✅ Estado de orden actualizado a: ${nuevoEstado}`);
            },
            error: (error: any) => {
              console.error('❌ Error al actualizar estado de orden:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al verificar estado de orden:', error);
      }
    });
  }
}
