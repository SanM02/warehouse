import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FacturaCompraService } from './factura-compra.service';
import { ProveedorService } from './proveedor.service';
import { FacturaCompra, FacturaCompraList, DetalleFacturaCompra, Proveedor, EstadisticasFacturasCompra } from './factura-compra.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-facturas-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas-compra.component.html',
  styleUrls: ['./facturas-compra.component.scss']
})
export class FacturasCompraComponent implements OnInit {
  facturas: FacturaCompraList[] = [];
  proveedores: Proveedor[] = [];
  productos: any[] = [];
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalFacturas = 0;
  pageSize = 10;
  
  // Filtros
  filtros = {
    search: '',
    proveedor: '',
    estado: '',
    tipo_factura: '',
    fecha_emision__gte: '',
    fecha_emision__lte: '',
    vencidas: false,
    proximas_vencer: false
  };
  
  // Modal
  mostrarModal = false;
  modoEdicion = false;
  facturaActual: FacturaCompra = this.getFacturaVacia();
  
  // Estadísticas
  estadisticas: EstadisticasFacturasCompra | null = null;
  mostrarEstadisticas = true;
  
  // Estados y opciones
  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente de Pago' },
    { value: 'pagada', label: 'Pagada' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'cancelada', label: 'Cancelada' }
  ];
  
  tiposFactura = [
    { value: '', label: 'Todos los tipos' },
    { value: 'contado', label: 'Contado' },
    { value: 'credito', label: 'Crédito' }
  ];
  
  cargando = false;

  constructor(
    private facturaCompraService: FacturaCompraService,
    private proveedorService: ProveedorService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarProveedores();
    this.cargarEstadisticas();
    this.cargarProductosDropdown();
  }

  cargarFacturas(pagina: number = 1): void {
    this.cargando = true;
    const params: any = {
      ...this.filtros,
      page: pagina,
      page_size: this.pageSize
    };
    
    // Remover filtros vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === false) {
        delete params[key];
      }
    });
    
    this.facturaCompraService.getFacturasCompra(params).subscribe({
      next: (response) => {
        this.facturas = response.results;
        this.totalFacturas = response.count;
        this.totalPages = Math.ceil(response.count / this.pageSize);
        this.currentPage = pagina;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        Swal.fire('Error', 'No se pudieron cargar las facturas de compra', 'error');
        this.cargando = false;
      }
    });
  }

  cargarProveedores(): void {
    this.proveedorService.getProveedores({ page_size: 1000 }).subscribe({
      next: (response: any) => {
        this.proveedores = response.results || response;
      },
      error: (error: any) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }

  cargarProductosDropdown(): void {
    this.http.get<any[]>('http://localhost:8000/api/productos/dropdown/').subscribe({
      next: (productos: any) => {
        this.productos = productos;
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  cargarEstadisticas(): void {
    this.facturaCompraService.getEstadisticas().subscribe({
      next: (stats) => {
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarFacturas(1);
  }

  limpiarFiltros(): void {
    this.filtros = {
      search: '',
      proveedor: '',
      estado: '',
      tipo_factura: '',
      fecha_emision__gte: '',
      fecha_emision__lte: '',
      vencidas: false,
      proximas_vencer: false
    };
    this.cargarFacturas(1);
  }

  abrirModalNueva(): void {
    this.modoEdicion = false;
    this.facturaActual = this.getFacturaVacia();
    this.mostrarModal = true;
  }

  abrirModalEditar(factura: FacturaCompraList): void {
    this.cargando = true;
    this.facturaCompraService.getFacturaCompra(factura.id).subscribe({
      next: (facturaCompleta) => {
        this.modoEdicion = true;
        this.facturaActual = facturaCompleta;
        this.mostrarModal = true;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar factura:', error);
        Swal.fire('Error', 'No se pudo cargar la factura', 'error');
        this.cargando = false;
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.facturaActual = this.getFacturaVacia();
  }

  guardarFactura(): void {
    if (!this.facturaActual.numero_factura || !this.facturaActual.proveedor) {
      Swal.fire('Error', 'Complete los campos obligatorios', 'error');
      return;
    }
    
    if (this.facturaActual.tipo_factura === 'credito' && !this.facturaActual.fecha_vencimiento) {
      Swal.fire('Error', 'Las facturas a crédito deben tener fecha de vencimiento', 'error');
      return;
    }
    
    if (this.facturaActual.detalles.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un detalle a la factura', 'error');
      return;
    }
    
    this.cargando = true;
    
    const operacion = this.modoEdicion
      ? this.facturaCompraService.updateFacturaCompra(this.facturaActual.id!, this.facturaActual)
      : this.facturaCompraService.createFacturaCompra(this.facturaActual);
    
    operacion.subscribe({
      next: () => {
        Swal.fire(
          'Éxito',
          `Factura ${this.modoEdicion ? 'actualizada' : 'creada'} correctamente`,
          'success'
        );
        this.cerrarModal();
        this.cargarFacturas(this.currentPage);
        this.cargarEstadisticas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al guardar factura:', error);
        const mensaje = error.error?.detail || 'No se pudo guardar la factura';
        Swal.fire('Error', mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  eliminarFactura(factura: FacturaCompraList): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: `Se eliminará la factura ${factura.numero_factura}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.facturaCompraService.deleteFacturaCompra(factura.id).subscribe({
          next: () => {
            Swal.fire('Eliminada', 'La factura ha sido eliminada', 'success');
            this.cargarFacturas(this.currentPage);
            this.cargarEstadisticas();
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire('Error', 'No se pudo eliminar la factura', 'error');
          }
        });
      }
    });
  }

  marcarComoPagada(factura: FacturaCompraList): void {
    Swal.fire({
      title: '¿Marcar como pagada?',
      text: `Factura ${factura.numero_factura}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar pagada',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.facturaCompraService.marcarPagada(factura.id).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Factura marcada como pagada', 'success');
            this.cargarFacturas(this.currentPage);
            this.cargarEstadisticas();
          },
          error: (error) => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
          }
        });
      }
    });
  }

  cancelarFactura(factura: FacturaCompraList): void {
    Swal.fire({
      title: '¿Cancelar factura?',
      text: `Factura ${factura.numero_factura}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.facturaCompraService.cancelar(factura.id).subscribe({
          next: () => {
            Swal.fire('Cancelada', 'La factura ha sido cancelada', 'success');
            this.cargarFacturas(this.currentPage);
            this.cargarEstadisticas();
          },
          error: (error) => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo cancelar la factura', 'error');
          }
        });
      }
    });
  }

  agregarDetalle(): void {
    this.facturaActual.detalles.push({
      producto: 0,
      cantidad: 1,
      precio_unitario: 0,
      lote: '',
      fecha_vencimiento_lote: ''
    });
  }

  eliminarDetalle(index: number): void {
    this.facturaActual.detalles.splice(index, 1);
    this.calcularTotales();
  }

  onProductoChange(detalle: DetalleFacturaCompra): void {
    const producto = this.productos.find((p: any) => p.id === detalle.producto);
    if (producto) {
      detalle.precio_unitario = producto.precio_costo || producto.precio_unitario || 0;
      this.calcularTotales();
    }
  }

  calcularTotales(): void {
    this.facturaActual.subtotal = this.facturaActual.detalles.reduce(
      (sum: number, detalle: DetalleFacturaCompra) => sum + (detalle.cantidad * detalle.precio_unitario),
      0
    );
    
    this.facturaActual.total = 
      this.facturaActual.subtotal - 
      this.facturaActual.descuento + 
      this.facturaActual.impuestos;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.cargarFacturas(pagina);
    }
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getFacturaVacia(): FacturaCompra {
    return {
      numero_factura: '',
      proveedor: 0,
      fecha_emision: new Date().toISOString().split('T')[0],
      tipo_factura: 'contado',
      estado: 'pendiente',
      subtotal: 0,
      descuento: 0,
      impuestos: 0,
      total: 0,
      detalles: []
    };
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-warning';
      case 'pagada': return 'bg-success';
      case 'vencida': return 'bg-danger';
      case 'cancelada': return 'bg-secondary';
      default: return 'bg-info';
    }
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(valor);
  }

  getNombreProveedor(id: number): string {
    const proveedor = this.proveedores.find((p: Proveedor) => p.id === id);
    return proveedor ? proveedor.nombre : '';
  }

  getNombreProducto(id: number): string {
    const producto = this.productos.find((p: any) => p.id === id);
    return producto ? producto.nombre : '';
  }
}
