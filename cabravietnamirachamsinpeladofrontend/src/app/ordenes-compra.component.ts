import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService, OrdenCompra, DetalleOrdenCompra, OrdenCompraResponse } from './orden-compra.service';
import { ProveedorService, Proveedor } from './proveedor.service';
import { ApiService } from './api.service';
import { SweetAlertService } from './sweetalert.service';
import { ProductoProveedorService } from './producto-proveedor.service';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['./ordenes-compra.component.scss']
})
export class OrdenesCompraComponent implements OnInit {
  ordenes: OrdenCompra[] = [];
  proveedores: Proveedor[] = [];
  productos: any[] = [];
  
  mostrarModal = false;
  esEdicion = false;
  cargando = false;
  cargandoProductos = false;
  
  // Filtros
  filtroEstado = '';
  filtroProveedor: number | null = null;
  fechaInicio = '';
  fechaFin = '';
  
  // Paginación
  totalOrdenes = 0;
  
  // Nueva orden
  nuevaOrden: OrdenCompra = {
    proveedor: 0,
    fecha_esperada: '',
    observaciones: '',
    estado: 'pendiente',
    detalles: []
  };

  // Detalle temporal para agregar productos
  detalleTemp = {
    producto: 0,
    cantidad_solicitada: 1,
    precio_unitario: '0.00'
  };

  // Productos filtrados por proveedor
  productosDisponibles: any[] = [];
  relacionesProductoProveedor: any[] = [];
  
  // Campo de búsqueda de productos
  busquedaProducto = '';
  productosFiltrados: any[] = [];

  constructor(
    private ordenService: OrdenCompraService,
    private proveedorService: ProveedorService,
    private apiService: ApiService,
    private sweetAlert: SweetAlertService,
    private productoProveedorService: ProductoProveedorService
  ) {}

  ngOnInit() {
    console.log('🚀 Inicializando componente OrdenesCompra...');
    this.cargarOrdenes();
    this.cargarProveedores();
    this.cargarProductos();
    console.log('✅ Componente OrdenesCompra inicializado');
  }

  cargarOrdenes() {
    this.cargando = true;
    const params: any = {};
    
    if (this.filtroEstado) {
      params.estado = this.filtroEstado;
    }
    
    if (this.filtroProveedor) {
      params.proveedor = this.filtroProveedor;
    }
    
    if (this.fechaInicio && this.fechaFin) {
      params.fecha_orden__gte = this.fechaInicio;
      params.fecha_orden__lte = this.fechaFin;
    }

    this.ordenService.getOrdenes(params).subscribe({
      next: (response: OrdenCompraResponse) => {
        this.ordenes = response.results;
        this.totalOrdenes = response.count;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar órdenes:', error);
        this.sweetAlert.error('Error al cargar órdenes de compra');
        this.cargando = false;
      }
    });
  }

  cargarProveedores() {
    console.log('📋 Cargando proveedores...');
    this.proveedorService.getProveedoresActivos().subscribe({
      next: (response) => {
        this.proveedores = response.results;
        console.log('✅ Proveedores cargados:', this.proveedores.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar proveedores:', error);
        this.sweetAlert.error('Error al cargar proveedores', 'Verifica la conexión al servidor');
      }
    });
  }

  cargarProductos() {
    this.cargandoProductos = true;
    console.log('📦 Iniciando carga de productos...');
    this.apiService.getProductosDropdown().subscribe({
      next: (productos) => {
        console.log('📦 Productos recibidos del API (dropdown):', productos);
        console.log('📦 Total productos:', productos.length);
        
        // Dropdown ya devuelve array directo, sin paginación
        this.productos = productos;
        
        console.log('📦 Productos asignados:', this.productos.length);
        this.cargandoProductos = false;

        // Si no hay productos después de cargar, mostrar advertencia
        if (this.productos.length === 0) {
          this.sweetAlert.info(
            'Agrega productos desde el módulo de Inventario',
            'No se encontraron productos en el inventario'
          );
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.productos = []; // Asegurar que sea un array vacío en caso de error
        this.cargandoProductos = false;

        // Mostrar mensaje de error con opción de reintentar
        if (error.status === 0) {
          this.sweetAlert.error(
            'No se pudo conectar con el servidor',
            'Verifica que Docker esté ejecutando y el backend esté activo. Recarga la página para intentar nuevamente.'
          );
        } else if (error.status === 401) {
          this.sweetAlert.info(
            'Por favor inicia sesión nuevamente',
            'Sesión expirada'
          );
        } else {
          this.sweetAlert.error(
            'Error al cargar productos',
            'Intenta recargar la página'
          );
        }
      }
    });
  }

  // Método llamado cuando se selecciona un proveedor
  onProveedorSeleccionado() {
    console.log('Proveedor seleccionado:', this.nuevaOrden.proveedor);
    this.cargarRelacionesProveedorProductos();
    // Mostrar todos los productos disponibles
    this.productosDisponibles = [...this.productos];
    this.productosFiltrados = [...this.productos];
  }

  // Filtrar productos basado en la búsqueda
  filtrarProductos() {
    if (!this.busquedaProducto || this.busquedaProducto.trim() === '') {
      this.productosFiltrados = [...this.productosDisponibles];
      return;
    }

    const termino = this.busquedaProducto.toLowerCase();
    this.productosFiltrados = this.productosDisponibles.filter(producto => {
      return (producto.nombre || '').toLowerCase().includes(termino) ||
             (producto.codigo || '').toLowerCase().includes(termino) ||
             (producto.categoria || '').toLowerCase().includes(termino);
    });
  }

  // Cargar las relaciones existentes entre el proveedor y productos
  cargarRelacionesProveedorProductos() {
    if (!this.nuevaOrden.proveedor || this.nuevaOrden.proveedor === 0) {
      this.relacionesProductoProveedor = [];
      return;
    }

    this.productoProveedorService.getProductoProveedores({ 
      proveedor: this.nuevaOrden.proveedor 
    }).subscribe({
      next: (response) => {
        this.relacionesProductoProveedor = response.results;
        console.log('Relaciones cargadas:', this.relacionesProductoProveedor);
      },
      error: (error) => {
        console.error('Error al cargar relaciones:', error);
        this.relacionesProductoProveedor = [];
      }
    });
  }

  // Obtener precio del proveedor para un producto específico
  obtenerPrecioProveedor(productoId: number): string {
    const relacion = this.relacionesProductoProveedor.find(
      rel => rel.producto === productoId
    );
    return relacion ? relacion.precio_compra : '0.00';
  }

  // Método llamado cuando se selecciona un producto
  onProductoSeleccionado() {
    if (this.detalleTemp.producto && this.nuevaOrden.proveedor) {
      // Autocompletar precio si existe relación
      const precioProveedor = this.obtenerPrecioProveedor(this.detalleTemp.producto);
      if (precioProveedor !== '0.00') {
        this.detalleTemp.precio_unitario = precioProveedor;
        console.log('Precio autocargado:', precioProveedor);
      }
    }
  }

  aplicarFiltros() {
    this.cargarOrdenes();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroProveedor = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.cargarOrdenes();
  }

  abrirModalNueva() {
    console.log('🔍 Abriendo modal nueva orden de compra...');
    
    this.nuevaOrden = {
      proveedor: 0,
      fecha_esperada: '',
      observaciones: '',
      estado: 'pendiente',
      detalles: []
    };
    
    // Limpiar filtros y relaciones - verificar que productos esté inicializado
    if (this.productos && Array.isArray(this.productos)) {
      this.productosDisponibles = [...this.productos];
      this.productosFiltrados = [...this.productos];
    } else {
      console.warn('⚠️ Productos no inicializado en abrirModalNueva');
      this.productosDisponibles = [];
      this.productosFiltrados = [];
    }
    this.relacionesProductoProveedor = [];
    this.busquedaProducto = '';
    
    this.esEdicion = false;
    this.mostrarModal = true;
    
    console.log('✅ Modal de orden de compra abierto');
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  agregarProducto() {
    if (!this.detalleTemp.producto || this.detalleTemp.cantidad_solicitada <= 0) {
      this.sweetAlert.error('Selecciona un producto y cantidad válida');
      return;
    }

    if (!this.nuevaOrden.proveedor) {
      this.sweetAlert.error('Debe seleccionar un proveedor primero');
      return;
    }

    const producto = this.productos.find(p => p.id == this.detalleTemp.producto);
    if (!producto) {
      this.sweetAlert.error('Producto no encontrado');
      return;
    }

    // Verificar si el producto ya está en la lista
    const existe = this.nuevaOrden.detalles.find(d => d.producto == this.detalleTemp.producto);
    if (existe) {
      this.sweetAlert.error('El producto ya está agregado a la orden');
      return;
    }

    const precio = parseFloat(this.detalleTemp.precio_unitario) || producto.precio_unitario || 0;
    const subtotal = this.detalleTemp.cantidad_solicitada * precio;

    const detalle: DetalleOrdenCompra = {
      producto: this.detalleTemp.producto,
      producto_nombre: producto.nombre,
      cantidad_solicitada: this.detalleTemp.cantidad_solicitada,
      cantidad_recibida: 0,
      precio_unitario: precio.toString(),
      subtotal: subtotal.toString(),
      cantidad_pendiente: this.detalleTemp.cantidad_solicitada,
      esta_completo: false
    };

    this.nuevaOrden.detalles.push(detalle);

    // 🚀 CREAR AUTOMÁTICAMENTE LA RELACIÓN PRODUCTO-PROVEEDOR (temporalmente deshabilitado)
    // this.crearRelacionProductoProveedor(this.detalleTemp.producto, precio);
    console.log('ℹ️ Creación automática de relaciones deshabilitada temporalmente');

    // Limpiar formulario temporal
    this.detalleTemp = {
      producto: 0,
      cantidad_solicitada: 1,
      precio_unitario: '0.00'
    };

    this.calcularTotal();
  }

  // Crear automáticamente la relación producto-proveedor
  async crearRelacionProductoProveedor(productoId: number, precio: number) {
    try {
      console.log('🔗 Intentando crear relación:', { productoId, precio, proveedor: this.nuevaOrden.proveedor });
      
      // Verificar si ya existe la relación
      const relacionExiste = this.relacionesProductoProveedor.find(
        rel => rel.producto === productoId && rel.proveedor === this.nuevaOrden.proveedor
      );

      if (relacionExiste) {
        console.log('✅ La relación ya existe, omitiendo creación');
        return;
      }

      // Validar datos antes de crear
      if (!productoId || !this.nuevaOrden.proveedor || precio <= 0) {
        console.warn('⚠️ Datos inválidos, omitiendo creación de relación');
        return;
      }

      // Crear nueva relación con validación de campos
      const nuevaRelacion = {
        producto: parseInt(productoId.toString()),
        proveedor: parseInt(this.nuevaOrden.proveedor.toString()),
        precio_compra: parseFloat(precio.toString()).toFixed(2).toString(),
        es_principal: false,
        tiempo_entrega_dias: 7,
        activo: true,
        notas: 'Creado automáticamente desde orden de compra'
      };

      console.log('📤 Enviando relación al backend:', nuevaRelacion);

      this.productoProveedorService.crearProductoProveedor(nuevaRelacion).subscribe({
        next: (relacion) => {
          console.log('✅ Relación creada exitosamente:', relacion);
          this.relacionesProductoProveedor.push(relacion);
        },
        error: (error) => {
          console.error('❌ Error al crear relación automática:', error);
          if (error.error) {
            console.error('❌ Detalles del error:', error.error);
          }
          // Continuar sin mostrar error al usuario
          console.log('ℹ️ Continuando sin relación automática');
        }
      });
    } catch (error) {
      console.error('❌ Error inesperado en crearRelacionProductoProveedor:', error);
    }
  }

  eliminarDetalle(index: number) {
    this.nuevaOrden.detalles.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    const total = this.nuevaOrden.detalles.reduce((sum, detalle) => {
      return sum + parseFloat(detalle.subtotal);
    }, 0);
    this.nuevaOrden.total_estimado = total.toString();
  }

  guardarOrden() {
    if (!this.validarOrden()) {
      return;
    }

    // Calcular total antes de enviar
    this.calcularTotal();
    
    this.cargando = true;

    // Crear una copia de la orden sin campos que genera el backend
    const ordenParaEnviar = {
      numero_orden: `ORD-${Date.now()}`, // Generar número de orden temporal
      proveedor: parseInt(this.nuevaOrden.proveedor.toString()),
      fecha_esperada: this.nuevaOrden.fecha_esperada,
      estado: this.nuevaOrden.estado,
      observaciones: this.nuevaOrden.observaciones || '',
      detalles: this.nuevaOrden.detalles.map(detalle => ({
        producto: parseInt(detalle.producto.toString()),
        cantidad_solicitada: parseInt(detalle.cantidad_solicitada.toString()),
        cantidad_recibida: 0,
        precio_unitario: parseFloat(detalle.precio_unitario.toString()).toString(),
        subtotal: (parseFloat(detalle.precio_unitario.toString()) * parseInt(detalle.cantidad_solicitada.toString())).toString(),
        cantidad_pendiente: parseInt(detalle.cantidad_solicitada.toString()),
        esta_completo: false
      }))
    };
    
    console.log('📤 Enviando orden al backend:', ordenParaEnviar);
    
    this.ordenService.crearOrden(ordenParaEnviar as OrdenCompra).subscribe({
      next: (response) => {
        console.log('✅ Orden creada exitosamente:', response);
        this.sweetAlert.success('Orden de compra creada exitosamente');
        this.cerrarModal();
        this.cargarOrdenes();
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error al crear orden:', error);
        console.error('❌ Error details:', error.error);
        
        let mensajeError = 'Error al crear orden de compra';
        
        if (error.error && typeof error.error === 'object') {
          // Mostrar errores específicos del backend
          const errores = Object.keys(error.error).map(campo => {
            const mensajes = Array.isArray(error.error[campo]) ? error.error[campo] : [error.error[campo]];
            return `${campo}: ${mensajes.join(', ')}`;
          });
          mensajeError = `Errores de validación:\n${errores.join('\n')}`;
        }
        
        this.sweetAlert.error(mensajeError);
        this.cargando = false;
      }
    });
  }

  async cancelarOrden(orden: OrdenCompra) {
    if (orden.estado !== 'pendiente') {
      this.sweetAlert.error('Solo se pueden cancelar órdenes pendientes');
      return;
    }

    const confirmacion = await this.sweetAlert.confirm(
      `¿Estás seguro de cancelar la orden ${orden.numero_orden}?`,
      'Esta acción no se puede deshacer'
    );

    if (confirmacion.isConfirmed && orden.id) {
      this.ordenService.cancelarOrden(orden.id).subscribe({
        next: (response) => {
          this.sweetAlert.success('Orden cancelada exitosamente');
          this.cargarOrdenes();
        },
        error: (error) => {
          console.error('Error al cancelar orden:', error);
          this.sweetAlert.error('Error al cancelar orden');
        }
      });
    }
  }

  validarOrden(): boolean {
    if (!this.nuevaOrden.proveedor) {
      this.sweetAlert.error('Debe seleccionar un proveedor');
      return false;
    }

    if (!this.nuevaOrden.fecha_esperada) {
      this.sweetAlert.error('Debe especificar la fecha esperada');
      return false;
    }

    if (this.nuevaOrden.detalles.length === 0) {
      this.sweetAlert.error('Debe agregar al menos un producto');
      return false;
    }

    return true;
  }

  obtenerNombreProveedor(proveedorId: number): string {
    const proveedor = this.proveedores.find(p => p.id === proveedorId);
    return proveedor ? proveedor.nombre : 'Proveedor no encontrado';
  }

  obtenerEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'pendiente': 'bg-warning',
      'parcial': 'bg-info',
      'completa': 'bg-success',
      'cancelada': 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  }

  trackByOrden(index: number, orden: OrdenCompra): number {
    return orden.id || index;
  }

  // Método de debugging
  debuggearComponente() {
    console.log('🔍 DEBUG - Estado del componente OrdenesCompra:');
    console.log('📊 Órdenes cargadas:', this.ordenes.length);
    console.log('🏢 Proveedores cargados:', this.proveedores.length);
    console.log('📦 Productos cargados:', this.productos.length);
    console.log('📋 Productos disponibles:', this.productosDisponibles.length);
    console.log('🔗 Relaciones cargadas:', this.relacionesProductoProveedor.length);
    console.log('⚙️ Estado cargando:', this.cargando);
    console.log('📝 Modal mostrar:', this.mostrarModal);
    
    // Probar abrir modal directamente
    console.log('🧪 Probando abrir modal...');
    this.mostrarModal = true;
    console.log('✅ Modal forzado a true');
    
    // Mostrar alerta de prueba
    this.sweetAlert.info('Componente funcionando correctamente', 'Debug OK');
  }
}
