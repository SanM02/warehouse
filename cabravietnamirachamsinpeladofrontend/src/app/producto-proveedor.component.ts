import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoProveedorService, ProductoProveedor, ProductoProveedorResponse } from './producto-proveedor.service';
import { ProveedorService, Proveedor } from './proveedor.service';
import { ApiService } from './api.service';
import { SweetAlertService } from './sweetalert.service';

@Component({
  selector: 'app-producto-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-proveedor.component.html',
  styleUrls: ['./producto-proveedor.component.scss']
})
export class ProductoProveedorComponent implements OnInit {
  relaciones: ProductoProveedor[] = [];
  productos: any[] = [];
  proveedores: Proveedor[] = [];
  
  mostrarModal = false;
  mostrarModalMasivo = false;
  esEdicion = false;
  cargando = false;
  
  // Filtros
  filtroProducto: number | null = null;
  filtroProveedor: number | null = null;
  filtroEsPrincipal = '';
  filtroActivo = '';
  
  // Paginación
  totalRelaciones = 0;
  
  // Nueva relación
  nuevaRelacion: ProductoProveedor = {
    producto: 0,
    proveedor: 0,
    precio_compra: '0.00',
    es_principal: false,
    tiempo_entrega_dias: 7,
    activo: true
  };

  // Variables para vista
  vistaAgrupada = true; // Por defecto mostrar agrupado por producto
  productosConProveedores: any[] = [];

  // Asignación masiva
  productoSeleccionadoMasivo: number = 0;
  proveedoresSeleccionados: number[] = [];

  constructor(
    private productoProveedorService: ProductoProveedorService,
    private proveedorService: ProveedorService,
    private apiService: ApiService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarDatos();
    this.cargarProveedores();
    this.cargarProductos();
    
    // Diagnóstico automático si no hay productos después de 3 segundos
    setTimeout(() => {
      if (this.productos.length === 0 && !this.cargando) {
        console.log('🚨 No se cargaron productos, ejecutando diagnóstico...');
        this.diagnosticarConexion();
      }
    }, 3000);
  }

  cargarDatos() {
    if (this.vistaAgrupada) {
      this.cargarVistaAgrupada();
    } else {
      this.cargarRelaciones();
    }
  }

  cargarVistaAgrupada() {
    this.cargando = true;
    
    // Cargar todos los productos y sus proveedores
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos recibidos para vista agrupada:', productos);
        
        if (!productos || productos.length === 0) {
          console.warn('No hay productos disponibles');
          this.productosConProveedores = [];
          this.cargando = false;
          this.sweetAlert.error('No hay productos disponibles', 'Asegúrate de que el backend esté funcionando');
          return;
        }

        const productosConInfo = productos.map(producto => ({
          ...producto,
          proveedores: [],
          proveedor_principal: null,
          total_proveedores: 0
        }));

        // Para cada producto, obtener sus proveedores
        const requests = productosConInfo.map(producto => 
          this.productoProveedorService.getProductoProveedores({ producto: producto.id })
        );

        Promise.all(requests.map(req => req.toPromise())).then(responses => {
          responses.forEach((response, index) => {
            if (response && response.results) {
              productosConInfo[index].proveedores = response.results;
              productosConInfo[index].total_proveedores = response.results.length;
              productosConInfo[index].proveedor_principal = response.results.find(p => p.es_principal);
            }
          });

          this.productosConProveedores = productosConInfo;
          this.cargando = false;
        }).catch(error => {
          console.error('Error al cargar vista agrupada:', error);
          this.cargando = false;
        });
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.sweetAlert.error('Error al cargar productos', 'Verifica que el servidor esté ejecutándose');
        this.productosConProveedores = [];
        this.cargando = false;
      }
    });
  }

  cargarRelaciones() {
    this.cargando = true;
    const params: any = {};
    
    if (this.filtroProducto) {
      params.producto = this.filtroProducto;
    }
    
    if (this.filtroProveedor) {
      params.proveedor = this.filtroProveedor;
    }
    
    if (this.filtroEsPrincipal) {
      params.es_principal = this.filtroEsPrincipal;
    }
    
    if (this.filtroActivo) {
      params.activo = this.filtroActivo;
    }

    this.productoProveedorService.getProductoProveedores(params).subscribe({
      next: (response: ProductoProveedorResponse) => {
        this.relaciones = response.results;
        this.totalRelaciones = response.count;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar relaciones:', error);
        this.sweetAlert.error('Error al cargar relaciones producto-proveedor');
        this.cargando = false;
      }
    });
  }

  cargarProveedores() {
    this.proveedorService.getProveedoresActivos().subscribe({
      next: (response) => {
        this.proveedores = response.results;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }

  cargarProductos() {
    console.log('Cargando productos...');
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos cargados:', productos);
        this.productos = productos || [];
        if (this.productos.length === 0) {
          console.warn('No se encontraron productos');
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.sweetAlert.error('Error al cargar productos', 'Revisa la conexión al servidor');
        this.productos = [];
      }
    });
  }

  cambiarVista() {
    this.vistaAgrupada = !this.vistaAgrupada;
    this.cargarDatos();
  }

  aplicarFiltros() {
    this.cargarDatos();
  }

  limpiarFiltros() {
    this.filtroProducto = null;
    this.filtroProveedor = null;
    this.filtroEsPrincipal = '';
    this.filtroActivo = '';
    this.cargarDatos();
  }

  abrirModalNueva() {
    this.nuevaRelacion = {
      producto: 0,
      proveedor: 0,
      precio_compra: '0.00',
      es_principal: false,
      tiempo_entrega_dias: 7,
      activo: true
    };
    this.esEdicion = false;
    this.mostrarModal = true;
  }

  abrirModalEdicion(relacion: ProductoProveedor) {
    this.nuevaRelacion = { ...relacion };
    this.esEdicion = true;
    this.mostrarModal = true;
  }

  abrirModalMasivo() {
    this.productoSeleccionadoMasivo = 0;
    this.proveedoresSeleccionados = [];
    this.mostrarModalMasivo = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.mostrarModalMasivo = false;
  }

  async guardarRelacion() {
    if (!this.validarRelacion()) {
      return;
    }

    // Si se marca como principal, verificar que no haya otro principal
    if (this.nuevaRelacion.es_principal && !this.esEdicion) {
      const validacion = await this.productoProveedorService.validarProveedorPrincipal(this.nuevaRelacion.producto).toPromise();
      
      if (validacion?.tieneProveedorPrincipal) {
        const confirmacion = await this.sweetAlert.confirm(
          'Ya existe un proveedor principal para este producto',
          '¿Deseas reemplazarlo por el nuevo proveedor?'
        );
        
        if (!confirmacion.isConfirmed) {
          return;
        }
      }
    }

    this.cargando = true;

    const operacion = this.esEdicion 
      ? this.productoProveedorService.actualizarProductoProveedor(this.nuevaRelacion.id!, this.nuevaRelacion)
      : this.productoProveedorService.crearProductoProveedor(this.nuevaRelacion);

    operacion.subscribe({
      next: (response) => {
        this.sweetAlert.success(
          this.esEdicion ? 'Relación actualizada' : 'Relación creada',
          'La relación producto-proveedor se ha guardado exitosamente'
        );
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al guardar relación:', error);
        this.sweetAlert.error('Error al guardar la relación');
        this.cargando = false;
      }
    });
  }

  async asignarProveedoresMasivo() {
    if (!this.productoSeleccionadoMasivo || this.proveedoresSeleccionados.length === 0) {
      this.sweetAlert.error('Selecciona un producto y al menos un proveedor');
      return;
    }

    const confirmacion = await this.sweetAlert.confirm(
      `Asignar ${this.proveedoresSeleccionados.length} proveedores`,
      `¿Asignar los proveedores seleccionados al producto?`
    );

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.cargando = true;

    const proveedoresData = this.proveedoresSeleccionados.map((proveedorId, index) => ({
      proveedor: proveedorId,
      precio_compra: '0.00',
      es_principal: index === 0, // El primero será principal
      tiempo_entrega_dias: 7,
      activo: true
    }));

    this.productoProveedorService.asignarMultiplesProveedores(this.productoSeleccionadoMasivo, proveedoresData).subscribe({
      next: (response) => {
        this.sweetAlert.success('Proveedores asignados exitosamente');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al asignar proveedores:', error);
        this.sweetAlert.error('Error al asignar proveedores masivamente');
        this.cargando = false;
      }
    });
  }

  async eliminarRelacion(relacion: ProductoProveedor) {
    const confirmacion = await this.sweetAlert.confirm(
      'Eliminar relación',
      `¿Eliminar la relación entre "${relacion.producto_nombre}" y "${relacion.proveedor_nombre}"?`
    );

    if (confirmacion.isConfirmed && relacion.id) {
      this.productoProveedorService.eliminarProductoProveedor(relacion.id).subscribe({
        next: () => {
          this.sweetAlert.success('Relación eliminada exitosamente');
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al eliminar relación:', error);
          this.sweetAlert.error('Error al eliminar relación');
        }
      });
    }
  }

  async establecerComoPrincipal(relacion: ProductoProveedor) {
    if (relacion.es_principal) {
      this.sweetAlert.error('Este proveedor ya es el principal');
      return;
    }

    const confirmacion = await this.sweetAlert.confirm(
      'Establecer como proveedor principal',
      `¿Establecer "${relacion.proveedor_nombre}" como proveedor principal de "${relacion.producto_nombre}"?`
    );

    if (confirmacion.isConfirmed && relacion.id) {
      this.productoProveedorService.establecerProveedorPrincipal(relacion.id).subscribe({
        next: () => {
          this.sweetAlert.success('Proveedor principal actualizado');
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al establecer proveedor principal:', error);
          this.sweetAlert.error('Error al actualizar proveedor principal');
        }
      });
    }
  }

  toggleProveedorSeleccionado(proveedorId: number) {
    if (!proveedorId) return; // Verificar que el ID exista
    
    const index = this.proveedoresSeleccionados.indexOf(proveedorId);
    if (index > -1) {
      this.proveedoresSeleccionados.splice(index, 1);
    } else {
      this.proveedoresSeleccionados.push(proveedorId);
    }
  }

  validarRelacion(): boolean {
    if (!this.nuevaRelacion.producto) {
      this.sweetAlert.error('Debe seleccionar un producto');
      return false;
    }

    if (!this.nuevaRelacion.proveedor) {
      this.sweetAlert.error('Debe seleccionar un proveedor');
      return false;
    }

    if (!this.nuevaRelacion.precio_compra || parseFloat(this.nuevaRelacion.precio_compra) < 0) {
      this.sweetAlert.error('El precio de compra debe ser mayor o igual a 0');
      return false;
    }

    if (this.nuevaRelacion.tiempo_entrega_dias < 1) {
      this.sweetAlert.error('El tiempo de entrega debe ser al menos 1 día');
      return false;
    }

    return true;
  }

  obtenerNombreProducto(productoId: number): string {
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : `Producto #${productoId}`;
  }

  obtenerNombreProveedor(proveedorId: number): string {
    const proveedor = this.proveedores.find(p => p.id === proveedorId);
    return proveedor ? proveedor.nombre : `Proveedor #${proveedorId}`;
  }

  trackByRelacion(index: number, relacion: ProductoProveedor): number {
    return relacion.id || index;
  }

  trackByProducto(index: number, producto: any): number {
    return producto.id || index;
  }

  // Método para diagnosticar la conexión
  async diagnosticarConexion() {
    try {
      console.log('🔍 Iniciando diagnóstico...');
      console.log('URL del API:', 'http://localhost:8000/api/productos/');
      
      // Probar conexión directa
      const response = await fetch('http://localhost:8000/api/productos/');
      console.log('📡 Estado de respuesta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        console.log('📊 Cantidad de productos:', data.length);
      } else {
        console.error('❌ Error HTTP:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      console.log('💡 Posibles causas:');
      console.log('   - El servidor Django no está ejecutándose');
      console.log('   - Puerto incorrecto (¿es 8000?)');
      console.log('   - Problemas de CORS');
      console.log('   - Firewall bloqueando la conexión');
    }
  }
}
