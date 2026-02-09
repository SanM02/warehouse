import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({
  selector: 'app-historial-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-movimientos.component.html',
  styleUrls: ['./historial-movimientos.component.scss']
})
export class HistorialMovimientosComponent {
  movimientos: any[] = [];
  productos: any[] = [];
  filtroProducto: string = '';
  filtroTipo: string = '';
  filtroUsuario: string = '';
  filtroFecha: string = '';

  constructor(private api: ApiService) {
    this.cargarMovimientos();
    this.api.getProductos().subscribe((data: any) => {
      this.productos = Array.isArray(data) ? data : (data.results || []);
    });
  }

  cargarMovimientos() {
    this.api.getMovimientos({
      producto: this.filtroProducto,
      tipo: this.filtroTipo,
      usuario: this.filtroUsuario,
      fecha: this.filtroFecha
    }).subscribe((data: any) => {
      this.movimientos = Array.isArray(data) ? data : (data.results || []);
    });
  }

  getNombreProducto(productoId: number): string {
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : `Producto ${productoId}`;
  }

  getUsuarioMovimiento(usuario: any): string {
    return usuario?.username || usuario || 'Sin usuario';
  }
}
