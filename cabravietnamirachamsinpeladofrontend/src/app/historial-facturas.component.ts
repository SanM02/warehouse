import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
declare var Swal: any;

@Component({
  selector: 'app-historial-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial-facturas.component.html',
  styleUrls: ['./historial-facturas.component.scss']
})
export class HistorialFacturasComponent implements OnInit {
  facturas: any[] = [];
  productos: any[] = [];
  facturaSeleccionada: any = null;
  filtroCliente: string = '';
  filtroFecha: string = '';
  
  // Control de modal
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  
  // Factura actual para crear/editar
  facturaActual: any = {
    tipo_documento: 'ninguno',
    numero_documento: '',
    nombre_cliente: '',
    email_cliente: '',
    telefono_cliente: '',
    direccion_cliente: '',
    subtotal: 0,
    descuento_total: 0,
    exonerado_iva: false,
    impuesto_total: 0,
    total: 0,
    observaciones: '',
    detalles: []
  };

  constructor(private api: ApiService, private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarProductos();
  }

  cargarFacturas(): void {
    this.api.getFacturas().subscribe({
      next: (data: any) => {
        this.facturas = Array.isArray(data) ? data : (data.results || []);
      },
      error: (error) => {
        Swal.fire('Error', 'No se pudieron cargar las facturas', 'error');
      }
    });
  }

  cargarProductos(): void {
    this.api.getProductos().subscribe({
      next: (data: any) => {
        this.productos = Array.isArray(data) ? data : (data.results || []);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  verDetalles(factura: any): void {
    this.facturaSeleccionada = factura;
  }

  cerrarDetalles(): void {
    this.facturaSeleccionada = null;
  }

  get facturasFiltradas() {
    return this.facturas.filter(f => {
      const nombreCliente = f.nombre_cliente || f.cliente || '';
      return (!this.filtroCliente || nombreCliente.toLowerCase().includes(this.filtroCliente.toLowerCase())) &&
             (!this.filtroFecha || f.fecha.startsWith(this.filtroFecha));
    });
  }

  limpiarFiltros(): void {
    this.filtroCliente = '';
    this.filtroFecha = '';
  }

  imprimirFactura(): void {
    window.print();
  }

  // ========== CRUD DE FACTURAS ==========

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.facturaActual = {
      tipo_documento: 'ninguno',
      numero_documento: '',
      nombre_cliente: '',
      email_cliente: '',
      telefono_cliente: '',
      direccion_cliente: '',
      subtotal: 0,
      descuento_total: 0,
      exonerado_iva: false,
      impuesto_total: 0,
      total: 0,
      observaciones: '',
      detalles: []
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(factura: any): void {
    this.modoEdicion = true;
    this.facturaActual = JSON.parse(JSON.stringify(factura));
    if (!this.facturaActual.detalles || this.facturaActual.detalles.length === 0) {
      this.facturaActual.detalles = [];
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.facturaActual = {
      tipo_documento: 'ninguno',
      numero_documento: '',
      nombre_cliente: '',
      email_cliente: '',
      telefono_cliente: '',
      direccion_cliente: '',
      subtotal: 0,
      descuento_total: 0,
      exonerado_iva: false,
      impuesto_total: 0,
      total: 0,
      observaciones: '',
      detalles: []
    };
  }

  guardarFactura(): void {
    // Validaciones
    if (!this.facturaActual.nombre_cliente || this.facturaActual.nombre_cliente.trim() === '') {
      Swal.fire('Error', 'El nombre del cliente es obligatorio', 'error');
      return;
    }

    if (!this.facturaActual.detalles || this.facturaActual.detalles.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
      return;
    }

    // Calcular totales antes de guardar
    this.calcularTotales();

    const datosFactura = {
      ...this.facturaActual,
      detalles: this.facturaActual.detalles.map((d: any) => ({
        producto: d.producto?.id || d.producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.cantidad * d.precio_unitario
      }))
    };

    if (this.modoEdicion) {
      this.api.actualizarFactura(this.facturaActual.id, datosFactura).subscribe({
        next: (response) => {
          Swal.fire('Éxito', 'Factura actualizada correctamente', 'success');
          this.cerrarModal();
          this.cargarFacturas();
        },
        error: (error) => {
          Swal.fire('Error', 'No se pudo actualizar la factura: ' + (error.error?.detail || error.message), 'error');
        }
      });
    } else {
      this.api.crearFactura(datosFactura).subscribe({
        next: (response) => {
          Swal.fire('Éxito', 'Factura creada correctamente', 'success');
          this.cerrarModal();
          this.cargarFacturas();
        },
        error: (error) => {
          Swal.fire('Error', 'No se pudo crear la factura: ' + (error.error?.detail || error.message), 'error');
        }
      });
    }
  }

  eliminarFactura(id: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.api.eliminarFactura(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La factura ha sido eliminada', 'success');
            this.cargarFacturas();
          },
          error: (error) => {
            Swal.fire('Error', 'No se pudo eliminar la factura', 'error');
          }
        });
      }
    });
  }

  // ========== MANEJO DE DETALLES ==========

  agregarDetalle(): void {
    this.facturaActual.detalles.push({
      producto: null,
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    });
  }

  eliminarDetalle(index: number): void {
    this.facturaActual.detalles.splice(index, 1);
    this.calcularTotales();
  }

  onProductoChange(detalle: any): void {
    if (detalle.producto) {
      const producto = this.productos.find((p: any) => p.id === parseInt(detalle.producto));
      if (producto) {
        detalle.precio_unitario = producto.precio_venta || 0;
        detalle.producto_nombre = producto.nombre;
        this.calcularSubtotalDetalle(detalle);
      }
    }
  }

  calcularSubtotalDetalle(detalle: any): void {
    detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.facturaActual.subtotal = this.facturaActual.detalles.reduce(
      (sum: number, detalle: any) => sum + (detalle.cantidad * detalle.precio_unitario), 0
    );

    // Calcular IVA (10%) si no está exonerado
    if (this.facturaActual.exonerado_iva) {
      this.facturaActual.impuesto_total = 0;
    } else {
      this.facturaActual.impuesto_total = this.facturaActual.subtotal * 0.1;
    }

    // Total = Subtotal - Descuento + IVA
    this.facturaActual.total = 
      this.facturaActual.subtotal - 
      this.facturaActual.descuento_total + 
      this.facturaActual.impuesto_total;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(valor);
  }
}
