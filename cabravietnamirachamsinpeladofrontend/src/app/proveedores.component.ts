import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService, Proveedor, ProveedorResponse } from './proveedor.service';
import { SweetAlertService } from './sweetalert.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;
  mostrarModal = false;
  esEdicion = false;
  cargando = false;
  
  // Filtros y búsqueda
  busqueda = '';
  soloActivos = true;
  
  // Paginación
  paginaActual = 1;
  totalProveedores = 0;
  siguientePagina: string | null = null;
  paginaAnterior: string | null = null;

  // Nuevo proveedor
  nuevoProveedor: Proveedor = {
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto: '',
    activo: true
  };

  constructor(
    private proveedorService: ProveedorService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.cargando = true;
    const params: any = {};
    
    if (this.busqueda) {
      params.search = this.busqueda;
    }
    
    if (this.soloActivos) {
      params.activo = 'true';
    }

    this.proveedorService.getProveedores(params).subscribe({
      next: (response: ProveedorResponse) => {
        this.proveedores = response.results;
        this.totalProveedores = response.count;
        this.siguientePagina = response.next || null;
        this.paginaAnterior = response.previous || null;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.sweetAlert.error('Error al cargar proveedores');
        this.cargando = false;
      }
    });
  }

  buscarProveedores() {
    this.paginaActual = 1;
    this.cargarProveedores();
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.cargarProveedores();
  }

  cambiarFiltroActivos() {
    this.paginaActual = 1;
    this.cargarProveedores();
  }

  abrirModalNuevo() {
    this.nuevoProveedor = {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      contacto: '',
      activo: true
    };
    this.esEdicion = false;
    this.mostrarModal = true;
  }

  abrirModalEdicion(proveedor: Proveedor) {
    this.nuevoProveedor = { ...proveedor };
    this.esEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.proveedorSeleccionado = null;
  }

  guardarProveedor() {
    if (!this.validarProveedor()) {
      return;
    }

    this.cargando = true;

    if (this.esEdicion && this.nuevoProveedor.id) {
      // Actualizar proveedor existente
      this.proveedorService.actualizarProveedor(this.nuevoProveedor.id, this.nuevoProveedor).subscribe({
        next: (response) => {
          this.sweetAlert.success('Proveedor actualizado correctamente');
          this.cerrarModal();
          this.cargarProveedores();
        },
        error: (error) => {
          console.error('Error al actualizar proveedor:', error);
          this.sweetAlert.error('Error al actualizar proveedor');
          this.cargando = false;
        }
      });
    } else {
      // Crear nuevo proveedor
      this.proveedorService.crearProveedor(this.nuevoProveedor).subscribe({
        next: (response) => {
          this.sweetAlert.success('Proveedor creado correctamente');
          this.cerrarModal();
          this.cargarProveedores();
        },
        error: (error) => {
          console.error('Error al crear proveedor:', error);
          this.sweetAlert.error('Error al crear proveedor');
          this.cargando = false;
        }
      });
    }
  }

  async eliminarProveedor(proveedor: Proveedor) {
    const confirmacion = await this.sweetAlert.confirm(
      `¿Estás seguro de que deseas desactivar al proveedor "${proveedor.nombre}"?`,
      'Esta acción se puede revertir'
    );

    if (confirmacion.isConfirmed && proveedor.id) {
      this.proveedorService.eliminarProveedor(proveedor.id).subscribe({
        next: (response) => {
          this.sweetAlert.success('Proveedor desactivado correctamente');
          this.cargarProveedores();
        },
        error: (error) => {
          console.error('Error al desactivar proveedor:', error);
          this.sweetAlert.error('Error al desactivar proveedor');
        }
      });
    }
  }

  validarProveedor(): boolean {
    if (!this.nuevoProveedor.nombre.trim()) {
      this.sweetAlert.error('El nombre del proveedor es obligatorio');
      return false;
    }

    if (!this.nuevoProveedor.telefono.trim()) {
      this.sweetAlert.error('El teléfono es obligatorio');
      return false;
    }

    if (!this.nuevoProveedor.email.trim()) {
      this.sweetAlert.error('El email es obligatorio');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.nuevoProveedor.email)) {
      this.sweetAlert.error('El formato del email no es válido');
      return false;
    }

    if (!this.nuevoProveedor.direccion.trim()) {
      this.sweetAlert.error('La dirección es obligatoria');
      return false;
    }

    if (!this.nuevoProveedor.contacto.trim()) {
      this.sweetAlert.error('El contacto es obligatorio');
      return false;
    }

    return true;
  }

  trackByProveedor(index: number, proveedor: Proveedor): number {
    return proveedor.id || index;
  }
}
