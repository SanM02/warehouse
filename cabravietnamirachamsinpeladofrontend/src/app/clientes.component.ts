import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from './cliente.service';
import { Cliente, ClienteResponse } from './cliente.model';
import { SweetAlertService } from './sweetalert.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  
  // Control de UI
  cargando = false;
  mostrarModal = false;
  esEdicion = false;
  guardando = false;
  
  // Filtros
  busqueda = '';
  filtroTipo = '';
  soloActivos = true;
  
  // Paginacion
  totalClientes = 0;
  paginaActual = 1;
  
  // Formulario
  nuevoCliente: Cliente = this.clienteVacio();

  constructor(
    private clienteService: ClienteService,
    private swal: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarClientes();
  }

  clienteVacio(): Cliente {
    return {
      tipo_documento: 'cedula',
      numero_documento: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      activo: true
    };
  }

  cargarClientes() {
    this.cargando = true;
    
    const filtros: any = {
      search: this.busqueda || undefined,
      tipo_documento: this.filtroTipo || undefined,
      page: this.paginaActual
    };
    
    if (this.soloActivos) {
      filtros.activo = true;
    }

    this.clienteService.getClientes(filtros).subscribe({
      next: (response: ClienteResponse) => {
        this.clientes = response.results;
        this.totalClientes = response.count;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.swal.error('Error al cargar clientes');
        this.cargando = false;
      }
    });
  }

  buscar() {
    this.paginaActual = 1;
    this.cargarClientes();
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroTipo = '';
    this.soloActivos = true;
    this.paginaActual = 1;
    this.cargarClientes();
  }

  abrirModalNuevo() {
    this.nuevoCliente = this.clienteVacio();
    this.esEdicion = false;
    this.mostrarModal = true;
  }

  abrirModalEditar(cliente: Cliente) {
    this.nuevoCliente = { ...cliente };
    this.esEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nuevoCliente = this.clienteVacio();
  }

  async guardarCliente() {
    if (!this.validarFormulario()) return;

    this.guardando = true;

    try {
      if (this.esEdicion && this.nuevoCliente.id) {
        await this.clienteService.actualizarCliente(
          this.nuevoCliente.id, 
          this.nuevoCliente
        ).toPromise();
        this.swal.success('Cliente actualizado correctamente');
      } else {
        await this.clienteService.crearCliente(this.nuevoCliente).toPromise();
        this.swal.success('Cliente creado correctamente');
      }
      
      this.cerrarModal();
      this.cargarClientes();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      
      if (error.error?.numero_documento) {
        this.swal.error('Ya existe un cliente con ese numero de documento');
      } else {
        this.swal.error('Error al guardar cliente');
      }
    } finally {
      this.guardando = false;
    }
  }

  validarFormulario(): boolean {
    if (!this.nuevoCliente.nombre?.trim()) {
      this.swal.error('El nombre es obligatorio');
      return false;
    }
    
    if (this.nuevoCliente.tipo_documento !== 'ninguno') {
      if (!this.nuevoCliente.numero_documento?.trim()) {
        this.swal.error('El numero de documento es obligatorio');
        return false;
      }
    }
    
    return true;
  }

  async confirmarEliminar(cliente: Cliente) {
    const result = await this.swal.confirm(
      'Eliminar Cliente',
      `¿Estas seguro de eliminar a "${cliente.nombre}"?`
    );

    if (result.isConfirmed && cliente.id) {
      try {
        await this.clienteService.eliminarCliente(cliente.id).toPromise();
        this.swal.success('Cliente eliminado');
        this.cargarClientes();
      } catch (error) {
        this.swal.error('No se puede eliminar: tiene facturas asociadas');
      }
    }
  }

  toggleActivo(cliente: Cliente) {
    if (!cliente.id) return;
    
    this.clienteService.actualizarCliente(cliente.id, {
      activo: !cliente.activo
    }).subscribe({
      next: () => {
        cliente.activo = !cliente.activo;
        this.swal.success(
          cliente.activo ? 'Cliente activado' : 'Cliente desactivado'
        );
      },
      error: () => this.swal.error('Error al actualizar estado')
    });
  }

  // Paginacion
  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarClientes();
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalClientes / 10);
  }

  get paginasArray(): number[] {
    const paginas: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }
}
