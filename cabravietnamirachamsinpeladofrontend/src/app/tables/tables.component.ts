import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { finalize } from 'rxjs/operators';
import { SweetAlertService } from '../sweetalert.service';

interface Producto {
  id: number;
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
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  getCategoriaClass(producto: Producto): string {
    let cat = producto.categoria ? producto.categoria.toLowerCase().replace(/ /g, '-') : 'nan';
    return 'categoria-' + cat;
  }
  productos: Producto[] = [];
  search: string = '';
  filtroCategoria: string = '';
  page: number = 1;
  pageSize: number = 10;
  animando: Set<Producto> = new Set();

  // NUEVO: Para edición y guardado de stock
  editandoStock: { [id: number]: number } = {};
  guardando: { [id: number]: boolean } = {};

  // NUEVO: Para edición completa de producto
  mostrarModalEdicion: boolean = false;
  productoEditando: Producto | null = null;
  guardandoEdicion: boolean = false;

  constructor(private api: ApiService, private swal: SweetAlertService) {}

  iniciarEdicion(producto: Producto) {
    this.editandoStock[producto.id] = producto.cantidad;
  }

  cancelarEdicion(producto: Producto) {
    delete this.editandoStock[producto.id];
  }

  guardarStock(producto: Producto) {
    const nuevoStock = this.editandoStock[producto.id];
    this.guardando[producto.id] = true;
    this.api.actualizarStock(producto.id, nuevoStock).subscribe({
      next: () => {
        producto.cantidad = nuevoStock;
        delete this.editandoStock[producto.id];
        this.guardando[producto.id] = false;
        this.swal.success('Stock actualizado correctamente');
      },
      error: (err) => {
        this.swal.error('Error al actualizar el stock');
        this.guardando[producto.id] = false;
      }
    });
  }

  ngOnInit() {
    this.cargarTodosLosProductos();
  }

  cargarTodosLosProductos() {
    let url = 'http://localhost:8000/api/productos/';
    let todos: Producto[] = [];
    const fetchPage = (pageUrl: string) => {
      this.api.getProductosPagina(pageUrl).pipe(finalize(() => {})).subscribe({
        next: (data: any) => {
          if (data && Array.isArray(data.results)) {
            // Mapear los campos del backend a los del frontend
            const mapeados = data.results.map((p: any) => ({
              id: p.id,
              codigo: p.codigo,
              nombre: p.nombre,
              categoria: p.categoria,
              marca: p.marca,
              modeloCompatible: p.modelo_compatible,
              descripcion: p.descripcion,
              cantidad: p.stock_disponible,
              stockMinimo: p.stock_minimo,
              precioCosto: Number(p.precio_costo),
              precioVenta: Number(p.precio_unitario), // Si tienes otro campo para precio de venta, cámbialo aquí
              proveedor: p.proveedor,
              fechaIngreso: p.fecha_actualizacion ? p.fecha_actualizacion.split('T')[0] : '',
              ubicacion: p.ubicacion_fisica
            }));
            todos = todos.concat(mapeados);
            if (data.next) {
              fetchPage(data.next);
            } else {
              this.productos = todos;
            }
          } else {
            this.productos = todos;
          }
        },
        error: (err) => {
          console.error('Error al obtener productos', err);
          this.productos = todos;
        }
      });
    };
    fetchPage(url);
  }

  get categorias(): string[] {
    if (!Array.isArray(this.productos)) return [];
    return Array.from(new Set(this.productos.map(p => p.categoria)));
  }

  get productosFiltrados(): Producto[] {
    let filtrados = this.productos;
    if (this.search.trim()) {
      filtrados = filtrados.filter(p =>
        (p.nombre || '').toLowerCase().includes(this.search.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(this.search.toLowerCase())
      );
    }
    if (this.filtroCategoria) {
      filtrados = filtrados.filter(p => p.categoria === this.filtroCategoria);
    }
    return filtrados;
  }

  get productosPagina(): Producto[] {
    const start = (this.page - 1) * this.pageSize;
    return this.productosFiltrados.slice(start, start + this.pageSize);
  }

  get totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.pageSize);
  }

  setPagina(p: number) {
    this.page = p;
  }

  sumar(producto: Producto) {
    if (this.editandoStock[producto.id] === undefined) {
      this.iniciarEdicion(producto);
    }
    this.editandoStock[producto.id]++;
    this.animar(producto);
  }

  restar(producto: Producto) {
    if (this.editandoStock[producto.id] === undefined) {
      this.iniciarEdicion(producto);
    }
    if (this.editandoStock[producto.id] > 0) {
      this.editandoStock[producto.id]--;
      this.animar(producto);
    }
  }

  animar(producto: Producto) {
    this.animando.add(producto);
    setTimeout(() => this.animando.delete(producto), 400);
  }

  trackByProductoId(index: number, item: Producto): number {
    return item.id;
  }

  // ========================================
  // EDICIÓN COMPLETA DE PRODUCTO
  // ========================================

  abrirModalEditar(producto: Producto): void {
    this.productoEditando = JSON.parse(JSON.stringify(producto)); // Copia profunda
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.productoEditando = null;
  }

  calcularPrecioVentaEdicion(): void {
    if (this.productoEditando && this.productoEditando.precioCosto > 0) {
      this.productoEditando.precioVenta = Math.round(this.productoEditando.precioCosto * 1.30);
    }
  }

  guardarEdicionCompleta(): void {
    if (!this.productoEditando || !this.productoEditando.nombre) {
      this.swal.error('El Nombre es obligatorio');
      return;
    }

    this.guardandoEdicion = true;

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

    this.api.actualizarProducto(this.productoEditando.id, productoBackend).subscribe({
      next: () => {
        this.swal.success('Producto actualizado correctamente');
        this.cerrarModalEdicion();
        this.cargarTodosLosProductos(); // Recargar lista
      },
      error: (err) => {
        console.error('Error:', err);
        this.swal.error('Error al actualizar el producto: ' + (err.error?.detail || 'Error desconocido'));
        this.guardandoEdicion = false;
      },
      complete: () => {
        this.guardandoEdicion = false;
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    this.swal.confirm(
      `¿Desea eliminar el producto "${producto.nombre}"?`,
      '¿Está seguro?'
    ).then((result: any) => {
      if (result.isConfirmed) {
        this.api.eliminarProducto(producto.id).subscribe({
          next: () => {
            this.swal.success('Producto eliminado correctamente');
            this.cargarTodosLosProductos(); // Recargar lista
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
