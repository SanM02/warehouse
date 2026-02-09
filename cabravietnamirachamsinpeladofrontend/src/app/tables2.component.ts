import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { finalize } from 'rxjs/operators';
import { SweetAlertService } from './sweetalert.service';

interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  modeloCompatible: string;
  descripcion: string;
  cantidad: number;
  stockMinimo: number;
  precioCosto: number;
  precioVenta: number;
  proveedor: string;
  fechaIngreso: string;
  ubicacion: string;
}

@Component({
  selector: 'app-tables2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tables2.component.html',
  styleUrls: ['./tables2.component.scss']
})
export class Tables2Component implements OnInit {
  // Generador automático de colores basado en hash del nombre
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getCategoriaBadgeStyle(categoria: string): any {
    if (!categoria) {
      return {
        'background': '#64748b',
        'color': 'white',
        'border': '3px solid #0f172a',
        'font-weight': '700',
        'letter-spacing': '1px',
        'padding': '0.5rem 1rem',
        'box-shadow': '4px 4px 0 rgba(0, 0, 0, 0.15)',
        'display': 'inline-block',
        'text-transform': 'uppercase',
        'font-size': '0.75rem'
      };
    }

    const hash = this.hashString(categoria);
    
    // Paleta de colores industriales
    const colores = [
      { bg: '#ff6b35', text: 'white' },      // Naranja industrial
      { bg: '#fbbf24', text: '#0f172a' },    // Amarillo energía
      { bg: '#1a365d', text: 'white' },      // Navy sólido
      { bg: '#8b5cf6', text: 'white' },      // Púrpura
      { bg: '#0ea5e9', text: 'white' },      // Azul agua
      { bg: '#dc2626', text: 'white' },      // Rojo alerta
      { bg: '#2d6a4f', text: 'white' },      // Verde industrial
      { bg: '#84cc16', text: '#0f172a' },    // Verde natural
      { bg: '#f59e0b', text: '#0f172a' },    // Ámbar
      { bg: '#06b6d4', text: 'white' },      // Cyan
      { bg: '#8b5a3c', text: 'white' },      // Marrón tierra
      { bg: '#6366f1', text: 'white' }       // Índigo
    ];

    const colorSeleccionado = colores[hash % colores.length];

    return {
      'background': colorSeleccionado.bg,
      'color': colorSeleccionado.text,
      'border': '3px solid #0f172a',
      'font-weight': '700',
      'letter-spacing': '1px',
      'padding': '0.5rem 1rem',
      'box-shadow': '4px 4px 0 rgba(0, 0, 0, 0.15)',
      'display': 'inline-block',
      'text-transform': 'uppercase',
      'font-size': '0.75rem'
    };
  }

  productos: Producto[] = [];
  search: string = '';
  page: number = 1;
  pageSize: number = 10;
  mostrarFormulario: boolean = false;
  guardando: boolean = false;
  Math = Math; // Para usar Math.min en el template
  
  // Edición
  mostrarModalEdicion: boolean = false;
  productoEditando: Producto | null = null;
  modoEdicion: boolean = false;
  
  nuevoProducto: Producto = this.productoVacio();

  constructor(
    private api: ApiService,
    private swal: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  productoVacio(): Producto {
    return {
      codigo: '',
      nombre: '',
      categoria: '',
      marca: '',
      modeloCompatible: '',
      descripcion: '',
      cantidad: 0,
      stockMinimo: 0,
      precioCosto: 0,
      precioVenta: 0,
      proveedor: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      ubicacion: ''
    };
  }

  // Calcular precio de venta automáticamente (precio_costo + 30%)
  calcularPrecioVenta(): void {
    if (this.nuevoProducto.precioCosto > 0) {
      this.nuevoProducto.precioVenta = Math.round(this.nuevoProducto.precioCosto * 1.30);
    }
  }

  calcularPrecioVentaEdicion(): void {
    if (this.productoEditando && this.productoEditando.precioCosto > 0) {
      this.productoEditando.precioVenta = Math.round(this.productoEditando.precioCosto * 1.30);
    }
  }

  cargarProductos() {
    this.api.getProductosDropdown().subscribe({
      next: (data: any[]) => {
        // getProductosDropdown() devuelve un array directo, no paginado
        this.productos = data.map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria,
          marca: p.marca || '',
          modeloCompatible: p.modelo_compatible || '',
          descripcion: p.descripcion || '',
          cantidad: p.stock_disponible,
          stockMinimo: p.stock_minimo,
          precioCosto: Number(p.precio_costo),
          precioVenta: Number(p.precio_unitario),
          proveedor: p.proveedor_texto || '',
          fechaIngreso: p.fecha_actualizacion ? p.fecha_actualizacion.split('T')[0] : '',
          ubicacion: p.ubicacion_fisica || ''
        }));
        console.log(`✅ Cargados ${this.productos.length} productos (sin límite de paginación)`);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.swal.error('Error al cargar productos');
      }
    });
  }

  mostrarFormularioNuevo() {
    this.mostrarFormulario = true;
    this.nuevoProducto = this.productoVacio();
  }

  cancelarNuevo() {
    this.mostrarFormulario = false;
    this.nuevoProducto = this.productoVacio();
  }

  guardarNuevoProducto() {
    if (!this.nuevoProducto.nombre) {
      this.swal.error('El Nombre es obligatorio');
      return;
    }

    this.guardando = true;
    
    const productoBackend = {
      codigo: this.nuevoProducto.codigo,
      nombre: this.nuevoProducto.nombre,
      categoria_texto: this.nuevoProducto.categoria, // Cambiado de categoria a categoria_texto
      marca: this.nuevoProducto.marca,
      modelo_compatible: this.nuevoProducto.modeloCompatible,
      descripcion: this.nuevoProducto.descripcion,
      stock_disponible: this.nuevoProducto.cantidad,
      stock_minimo: this.nuevoProducto.stockMinimo,
      precio_costo: this.nuevoProducto.precioCosto,
      precio_unitario: this.nuevoProducto.precioVenta,
      proveedor_texto: this.nuevoProducto.proveedor,
      ubicacion_fisica: this.nuevoProducto.ubicacion
    };

    this.api.crearProducto(productoBackend).pipe(
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => {
        this.swal.success('Producto creado correctamente');
        this.cancelarNuevo();
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error:', err);
        this.swal.error('Error al crear el producto: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  get productosFiltrados() {
    if (!this.search) return this.productos;
    const s = this.search.toLowerCase();
    return this.productos.filter(p =>
      (p.nombre || '').toLowerCase().includes(s) ||
      (p.codigo || '').toLowerCase().includes(s) ||
      (p.categoria || '').toLowerCase().includes(s)
    );
  }

  get productosPaginados() {
    const inicio = (this.page - 1) * this.pageSize;
    return this.productosFiltrados.slice(inicio, inicio + this.pageSize);
  }

  get totalPaginas() {
    return Math.ceil(this.productosFiltrados.length / this.pageSize);
  }

  // ========== FUNCIONES DE EDICIÓN ==========

  abrirModalEditar(producto: Producto): void {
    this.modoEdicion = true;
    this.productoEditando = JSON.parse(JSON.stringify(producto)); // Copia profunda
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.productoEditando = null;
    this.modoEdicion = false;
  }

  guardarEdicion(): void {
    if (!this.productoEditando || !this.productoEditando.nombre) {
      this.swal.error('El Nombre es obligatorio');
      return;
    }

    this.guardando = true;

    const productoBackend = {
      codigo: this.productoEditando.codigo || '',
      nombre: this.productoEditando.nombre,
      categoria_texto: this.productoEditando.categoria,
      marca: this.productoEditando.marca,
      modelo_compatible: this.productoEditando.modeloCompatible,
      descripcion: this.productoEditando.descripcion,
      stock_disponible: this.productoEditando.cantidad,
      stock_minimo: this.productoEditando.stockMinimo,
      precio_costo: this.productoEditando.precioCosto,
      precio_unitario: this.productoEditando.precioVenta,
      proveedor_texto: this.productoEditando.proveedor,
      ubicacion_fisica: this.productoEditando.ubicacion
    };

    this.api.actualizarProducto(this.productoEditando.id!, productoBackend).pipe(
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => {
        this.swal.success('Producto actualizado correctamente');
        this.cerrarModalEdicion();
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error:', err);
        this.swal.error('Error al actualizar el producto: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    this.swal.confirm(
      `¿Desea eliminar el producto "${producto.nombre}"?`,
      '¿Está seguro?'
    ).then((result: any) => {
      if (result.isConfirmed) {
        this.api.eliminarProducto(producto.id!).subscribe({
          next: () => {
            this.swal.success('Producto eliminado correctamente');
            this.cargarProductos();
          },
          error: (err) => {
            console.error('Error:', err);
            this.swal.error('Error al eliminar el producto');
          }
        });
      }
    });
  }
}
