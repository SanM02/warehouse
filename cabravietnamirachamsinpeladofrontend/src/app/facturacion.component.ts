
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { ClienteService } from './cliente.service';
import { Cliente, BusquedaClienteResponse } from './cliente.model';
import { Factura, FacturaDetalle } from './factura.model';
import { Router } from '@angular/router';
import { SweetAlertService } from './sweetalert.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

// Interfaz para la nueva factura mejorada
interface NuevaFactura {
  tipo_documento: 'ruc' | 'cedula' | 'ninguno';
  numero_documento: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  direccion_cliente: string;
  observaciones: string;
  descuento_total: number;
  exonerado_iva: boolean;
  detalles: FacturaDetalle[];
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss']
})
export class FacturacionComponent implements OnInit, OnDestroy {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  detalles: FacturaDetalle[] = [];
  mensaje: string = '';
  loading: boolean = false;
  searchTerm: string = '';
  searchSubject = new Subject<string>();
  productoSeleccionado: any = null;
  cantidadSeleccionada: number = 1;
  showDropdown: boolean = false;

  // AUTOCOMPLETADO DE CLIENTE
  buscandoCliente = false;
  clienteEncontrado: Cliente | null = null;
  clienteEsNuevo = false;
  guardarClienteAutomatico = false;

  // UI toggles
  mostrarDatosOpcionales = false;

  // NUEVOS CAMPOS PARA FACTURACIÓN MEJORADA
  public nuevaFactura: NuevaFactura = {
    // Datos del cliente
    tipo_documento: 'cedula', // SIEMPRE en minúsculas
    numero_documento: '',
    nombre_cliente: '',
    email_cliente: '',
    telefono_cliente: '',
    direccion_cliente: '',
    
    // Datos de la factura
    observaciones: '',
    descuento_total: 0,
    exonerado_iva: localStorage.getItem('exonerado_iva') === 'true',
    
    // Los detalles se mantienen vacíos aquí, usamos la propiedad independiente
    detalles: []
  };

  // Variables para cálculos
  public subtotal: number = 0;
  public total: number = 0;
  public impuestoTotal: number = 0;  // IVA 10%

  public get productosConStock() {
    return this.productosFiltrados.filter(p => p.stock_disponible > 0);
  }

  constructor(
    private api: ApiService,
    private clienteService: ClienteService,
    private router: Router, 
    private swal: SweetAlertService,
    private pdfService: PdfGeneratorService
  ) {}

  ngOnInit() {
    this.cargarTodosLosProductos();
    this.setupSearch();
    this.cargarDatosGuardados(); // Cargar datos persistidos
  }

  ngOnDestroy() {
    // Limpiar timer al destruir el componente
    if (this.guardarTimer) {
      clearTimeout(this.guardarTimer);
    }
    
    // Guardar datos una última vez antes de destruir
    this.guardarDatos();
  }

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.trim() === '') {
          return of(this.productos);
        }
        const filtered = this.productos.filter(p => 
          (p.nombre || '').toLowerCase().includes(term.toLowerCase()) ||
          (p.marca || '').toLowerCase().includes(term.toLowerCase()) ||
          (p.codigo || '').toLowerCase().includes(term.toLowerCase())
        );
        return of(filtered);
      })
    ).subscribe(productos => {
      this.productosFiltrados = productos;
    });
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.searchSubject.next(term);
    this.showDropdown = term.length > 0;
  }

  // Método para cuando se hace input en el buscador
  onSearchInput(event: any) {
    const term = event.target.value;
    this.onSearchChange(term);
  }

  onInputBlur() {
    // Delay para permitir que el click en el dropdown funcione
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  cargarTodosLosProductos() {
    this.loading = true;
    this.api.getProductosDropdown().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = [...this.productos];
        console.log('Productos cargados (dropdown):', this.productos.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
        this.productosFiltrados = [];
        this.loading = false;
      }
    });
  }

  public seleccionarProducto(producto: any) {
    this.productoSeleccionado = producto;
    this.cantidadSeleccionada = 1;
    this.searchTerm = '';
    this.productosFiltrados = [];
    this.showDropdown = false;
  }

  cancelarSeleccion() {
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.searchTerm = '';
    this.productosFiltrados = [];
    this.showDropdown = false;
  }

  public agregarDetalle() {
    if (!this.productoSeleccionado) {
      this.swal.error('Seleccione un producto válido.');
      return;
    }
    if (!this.cantidadSeleccionada || this.cantidadSeleccionada <= 0) {
      this.swal.error('Ingrese una cantidad válida.');
      return;
    }
    if (this.cantidadSeleccionada > this.productoSeleccionado.stock_disponible) {
      this.swal.error(`Stock insuficiente. Disponible: ${this.productoSeleccionado.stock_disponible}`);
      return;
    }
    if (this.productoSeleccionado.precio_unitario === null || this.productoSeleccionado.precio_unitario === undefined) {
      this.swal.error('El producto seleccionado no tiene precio.');
      return;
    }

    // Verificar si el producto ya está en los detalles
    const existingIndex = this.detalles.findIndex(d => d.producto === this.productoSeleccionado.id);
    if (existingIndex >= 0) {
      // Actualizar cantidad
      const newCantidad = this.detalles[existingIndex].cantidad + this.cantidadSeleccionada;
      if (newCantidad > this.productoSeleccionado.stock_disponible) {
        this.swal.error(`Stock insuficiente. Disponible: ${this.productoSeleccionado.stock_disponible}`);
        return;
      }
      this.detalles[existingIndex].cantidad = newCantidad;
      const precio = parseFloat(this.detalles[existingIndex].precio_unitario?.toString());
      const subtotalCalculado = precio * newCantidad;
      this.detalles[existingIndex].subtotal = parseFloat(subtotalCalculado.toFixed(2));
      
      // Ya no necesitamos duplicar en nuevaFactura.detalles
    } else {
      // Agregar nuevo detalle
      const precioUnitario = parseFloat(this.productoSeleccionado.precio_unitario?.toString());
      const subtotalCalculado = precioUnitario * this.cantidadSeleccionada;
      
      const nuevoDetalle: FacturaDetalle = {
        producto: this.productoSeleccionado.id,
        producto_nombre: this.productoSeleccionado.nombre,
        codigo_producto: this.productoSeleccionado.codigo,
        marca_producto: this.productoSeleccionado.marca || '',
        categoria_producto: this.productoSeleccionado.categoria || '',
        stock_disponible: this.productoSeleccionado.stock_disponible,
        cantidad: this.cantidadSeleccionada,
        precio_unitario: precioUnitario,
        subtotal: parseFloat(subtotalCalculado.toFixed(2)) // Asegurar 2 decimales
      };
      
      this.detalles.push(nuevoDetalle);
    }

    // Limpiar selección
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    
    // Recalcular totales
    this.calcularTotales();
    
    // Guardar datos automáticamente
    this.guardarDatos();
    
    this.swal.success('Producto agregado al carrito');
  }

  // Cambiar cantidad en carrito con botones +/-
  public cambiarCantidad(index: number, delta: number) {
    const detalle = this.detalles[index];
    const nuevaCantidad = detalle.cantidad + delta;
    const maxStock = detalle.stock_disponible || this.productos.find(p => p.id === detalle.producto)?.stock_disponible || 999;
    
    if (nuevaCantidad >= 1 && nuevaCantidad <= maxStock) {
      this.detalles[index].cantidad = nuevaCantidad;
      const precio = parseFloat(this.detalles[index].precio_unitario?.toString());
      this.detalles[index].subtotal = parseFloat((precio * nuevaCantidad).toFixed(2));
      this.calcularTotales();
      this.guardarDatos();
    }
  }

  public editarDetalle(index: number) {
    const detalle = this.detalles[index];
    const producto = this.productos.find(p => p.id === detalle.producto);
    
    const nuevaCantidadStr = prompt(
      `Ingrese la nueva cantidad para ${this.getNombreProducto(detalle.producto)}:`,
      detalle.cantidad.toString()
    );
    
    if (nuevaCantidadStr !== null) {
      const nuevaCantidad = parseInt(nuevaCantidadStr, 10);
      if (nuevaCantidad && nuevaCantidad > 0 && nuevaCantidad <= (producto?.stock_disponible || 999)) {
        this.detalles[index].cantidad = nuevaCantidad;
        const precio = parseFloat(this.detalles[index].precio_unitario?.toString());
        const subtotalCalculado = precio * nuevaCantidad;
        this.detalles[index].subtotal = parseFloat(subtotalCalculado.toFixed(2));
        this.calcularTotales();
        this.guardarDatos();
        this.swal.success('Cantidad actualizada');
      } else {
        this.swal.error('Cantidad inválida o excede el stock disponible');
      }
    }
  }

  public confirmarEliminarDetalle(index: number) {
    const nombreProducto = this.getNombreProducto(this.detalles[index].producto);
    if (confirm(`¿Está seguro de que desea eliminar "${nombreProducto}" del carrito?`)) {
      this.eliminarDetalle(index);
      this.guardarDatos(); // Guardar cambios
      this.swal.success('Producto eliminado del carrito');
    }
  }

  limpiarCarrito() {
    if (confirm('¿Está seguro de que desea eliminar todos los productos del carrito?')) {
      this.detalles = [];
      this.calcularTotales();
      this.guardarDatos(); // Guardar cambios
      this.swal.success('Carrito limpiado');
    }
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  // Método para validar RUC/Cédula - SIGUIENDO ESPECIFICACIONES DEL BACKEND
  public validarDocumento(): boolean {
    const doc = this.nuevaFactura.numero_documento.trim();
    
    if (this.nuevaFactura.tipo_documento === 'ruc') {
      // RUC: debe tener formato con guión (ej: 1234567-8)
      return doc.includes('-') && /^\d+-\d+$/.test(doc);
    } else if (this.nuevaFactura.tipo_documento === 'cedula') {
      // Cédula: cualquier formato es válido (según especificaciones)
      return doc.length > 0;
    }
    
    return true; // Para tipo "ninguno" o otros casos
  }

  // Calcular totales automáticamente (CON IVA 10% o sin IVA si está exonerado)
  public calcularTotales(): void {
    // Subtotal de productos
    this.subtotal = this.detalles.reduce((sum, detalle) => {
      const cantidad = parseFloat(detalle.cantidad?.toString()) || 0;
      const precio = parseFloat(detalle.precio_unitario?.toString()) || 0;
      return sum + (cantidad * precio);
    }, 0);
    
    // Descuento
    const descuento = parseFloat(this.nuevaFactura.descuento_total?.toString()) || 0;
    
    // Base imponible (subtotal - descuento)
    const baseImponible = this.subtotal - descuento;
    
    // IVA 10% sobre base imponible (solo si no está exonerado)
    if (this.nuevaFactura.exonerado_iva) {
      this.impuestoTotal = 0;
    } else {
      this.impuestoTotal = baseImponible * 0.10;
    }
    
    // Total final (base + IVA)
    this.total = baseImponible + this.impuestoTotal;
  }

  // Métodos para cálculos en el template
  public getCantidadTotal(): number {
    return this.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  }

  public getSubtotal(): number {
    return this.detalles.reduce((sum, d) => {
      const cantidad = parseFloat(d.cantidad?.toString()) || 0;
      const precio = parseFloat(d.precio_unitario?.toString()) || 0;
      return sum + (cantidad * precio);
    }, 0);
  }

  public getTotal(): number {
    const subtotalCalc = this.getSubtotal();
    const descuento = parseFloat(this.nuevaFactura.descuento_total?.toString()) || 0;
    const baseImponible = subtotalCalc - descuento;
    // IVA 10% solo si no está exonerado
    const iva = this.nuevaFactura.exonerado_iva ? 0 : (baseImponible * 0.10);
    return baseImponible + iva;
  }

  // Crear factura con nuevos campos
  public async crearFactura(): Promise<void> {
    if (!this.validarFactura()) return;

    this.loading = true;
    
    try {
      // ✅ Los totales se calculan automáticamente en el backend
      // No necesitamos calcular subtotal ni total aquí
      
      const facturaData = {
        // === DATOS DEL CLIENTE (OBLIGATORIOS) ===
        tipo_documento: this.nuevaFactura.tipo_documento.toLowerCase(), // "cedula", "ruc", o "ninguno"
        numero_documento: this.nuevaFactura.numero_documento.trim(), // String obligatorio
        nombre_cliente: this.nuevaFactura.nombre_cliente.trim(), // String obligatorio
        
        // === DATOS ADICIONALES DEL CLIENTE (OPCIONALES) ===
        email_cliente: this.nuevaFactura.email_cliente.trim() || "", // String opcional
        telefono_cliente: this.nuevaFactura.telefono_cliente.trim() || "", // String opcional
        direccion_cliente: this.nuevaFactura.direccion_cliente.trim() || "", // String opcional
        
        // === CONTROL DE FACTURA (OPCIONALES) ===
        descuento_total: parseFloat(this.nuevaFactura.descuento_total?.toString() || '0').toFixed(2), // Decimal con 2 decimales
        exonerado_iva: Boolean(this.nuevaFactura.exonerado_iva), // Boolean para exonerar IVA (asegurar tipo)
        observaciones: this.nuevaFactura.observaciones.trim() || "", // String opcional
        
        // === PRODUCTOS (OBLIGATORIO) ===
        detalles: this.detalles.map(detalle => ({
          producto: parseInt(detalle.producto?.toString()), // ID del producto (obligatorio)
          cantidad: parseInt(detalle.cantidad?.toString()), // Entero positivo (obligatorio)
          precio_unitario: parseFloat(detalle.precio_unitario?.toString()).toFixed(2), // Decimal con 2 decimales
          subtotal: (parseInt(detalle.cantidad?.toString()) * parseFloat(detalle.precio_unitario?.toString())).toFixed(2) // Decimal con 2 decimales
        }))
        // ❌ NO enviar: id, numero_factura, fecha, subtotal, impuesto_total, total, usuario
        // ✅ Estos se calculan automáticamente en el backend
      };

      console.log('Datos a enviar:', facturaData);
      
      // Validación adicional antes de enviar
      if (!facturaData.detalles || facturaData.detalles.length === 0) {
        throw new Error('No hay productos en la factura');
      }
      
      // Verificar que todos los detalles tengan los campos requeridos
      for (const detalle of facturaData.detalles) {
        if (!detalle.producto || !detalle.cantidad || !detalle.precio_unitario || !detalle.subtotal) {
          console.error('Detalle incompleto:', detalle);
          throw new Error('Hay productos con datos incompletos');
        }
        
        // Validar que los números sean válidos
        const precio = typeof detalle.precio_unitario === 'string' ? parseFloat(detalle.precio_unitario) : detalle.precio_unitario;
        const subtotal = typeof detalle.subtotal === 'string' ? parseFloat(detalle.subtotal) : detalle.subtotal;
        
        if (isNaN(detalle.producto) || isNaN(detalle.cantidad) || isNaN(precio) || isNaN(subtotal)) {
          console.error('Detalle con valores inválidos:', detalle);
          throw new Error('Hay productos con valores numéricos inválidos');
        }
      }
      
      const response = await this.api.crearFactura(facturaData).toPromise();
      
      this.swal.success('Factura creada exitosamente');
      
      // Guardar cliente nuevo si corresponde
      await this.guardarClienteNuevo();
      
      // Preguntar si quiere generar PDF
      const result = await this.swal.confirm(
        '¿Deseas generar el PDF de la factura?',
        'Factura creada'
      );
      
      if (result.isConfirmed) {
        this.generarPDF(response.id);
      }
      
      this.limpiarFormulario();
      this.loading = false;
      
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      
      let mensajeError = 'Error desconocido al crear la factura';
      
      if (error.status === 400) {
        mensajeError = 'Datos inválidos. Revise los campos de la factura.';
        
        // Mostrar el error específico del backend si existe
        if (error.error) {
          if (Array.isArray(error.error) && error.error.length > 0) {
            // Error directo como array de strings
            mensajeError = error.error[0];
          } else if (error.error.detalles) {
            console.error('Detalles del error:', error.error.detalles);
            // Mostrar errores específicos de los detalles
            if (Array.isArray(error.error.detalles)) {
              const erroresDetalle = error.error.detalles.map((detalle: any, index: number) => {
                if (detalle.subtotal) {
                  return `Producto ${index + 1}: ${detalle.subtotal.join(', ')}`;
                }
                return `Producto ${index + 1}: Error en los datos`;
              }).join('\n');
              mensajeError += '\n\n' + erroresDetalle;
            }
          }
        }
      } else if (error.status === 500) {
        mensajeError = 'Error interno del servidor. Contacte al administrador del sistema.';
      } else if (error.status === 0) {
        mensajeError = 'No se puede conectar con el servidor. Verifique su conexión.';
      }
      
      this.swal.error(mensajeError);
      this.loading = false;
    }
  }

  // Generar PDF de la factura
  async generarPDF(facturaId: number): Promise<void> {
    try {
      // Obtener datos completos de la factura
      const datosCompletos = await this.api.getDatosCompletosFactura(facturaId).toPromise();
      
      // Generar PDF usando el servicio
      this.pdfService.generarFacturaPDF(datosCompletos);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.swal.error('Error al generar el PDF');
    }
  }

  // Validar factura antes de enviar - SIGUIENDO ESPECIFICACIONES EXACTAS DEL BACKEND
  private validarFactura(): boolean {
    const errors: string[] = [];

    // 1. Campos obligatorios básicos
    if (!this.nuevaFactura.nombre_cliente || this.nuevaFactura.nombre_cliente.trim() === '') {
      errors.push('El nombre del cliente es obligatorio');
    }
    
    if (!this.nuevaFactura.tipo_documento) {
      errors.push('El tipo de documento es obligatorio');
    }

    // 2. Validación de documento según tipo
    if (this.nuevaFactura.tipo_documento === 'ruc') {
      if (!this.nuevaFactura.numero_documento) {
        errors.push('El número de RUC es obligatorio');
      } else if (!this.nuevaFactura.numero_documento.includes('-')) {
        errors.push('El RUC debe contener un guión (-)');
      }
    }
    
    if (this.nuevaFactura.tipo_documento === 'cedula') {
      if (!this.nuevaFactura.numero_documento || this.nuevaFactura.numero_documento.trim() === '') {
        errors.push('El número de cédula es obligatorio');
      }
      // Sin más validaciones - cualquier formato es válido
    }
    
    // Para tipo "ninguno" - no se requiere documento

    // 3. Validación de productos
    if (!this.detalles || this.detalles.length === 0) {
      errors.push('Debe incluir al menos un producto');
    } else {
      this.detalles.forEach((detalle, index) => {
        if (!detalle.producto) {
          errors.push(`Producto ${index + 1}: Debe seleccionar un producto`);
        }
        if (!detalle.cantidad || detalle.cantidad <= 0) {
          errors.push(`Producto ${index + 1}: La cantidad debe ser mayor a 0`);
        }
        if (detalle.precio_unitario !== undefined && detalle.precio_unitario <= 0) {
          errors.push(`Producto ${index + 1}: El precio debe ser mayor a 0`);
        }
      });
    }

    // Mostrar errores si los hay
    if (errors.length > 0) {
      this.swal.error('Errores de validación:\n' + errors.join('\n'));
      return false;
    }

    return true;
  }

  // Limpiar formulario
  public limpiarFormulario(): void {
    this.nuevaFactura = {
      tipo_documento: 'cedula', // SIEMPRE en minúsculas
      numero_documento: '',
      nombre_cliente: '',
      email_cliente: '',
      telefono_cliente: '',
      direccion_cliente: '',
      observaciones: '',
      descuento_total: 0,
      exonerado_iva: localStorage.getItem('exonerado_iva') === 'true',
      detalles: [] // Esta se mantiene vacía, usamos la propiedad independiente
    };
    this.detalles = [];
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.calcularTotales();
    this.limpiarDatosGuardados(); // Limpiar datos guardados después de crear factura
  }

  public getNombreProducto(productoId: number): string {
    const prod = this.productos.find((p: any) => p.id === productoId);
    return prod ? prod.nombre : `Producto ${productoId}`;
  }

  getMarcaProducto(productoId: number): string {
    const prod = this.productos.find((p: any) => p.id === productoId);
    return prod ? prod.marca : '';
  }

  // ========== MÉTODOS PARA PERSISTIR DATOS ==========
  
  private guardarDatos(): void {
    try {
      const datosAGuardar = {
        nuevaFactura: this.nuevaFactura,
        detalles: this.detalles,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('facturacion_borrador', JSON.stringify(datosAGuardar));
    } catch (error) {
      console.warn('No se pudieron guardar los datos del borrador:', error);
    }
  }

  private cargarDatosGuardados(): void {
    try {
      const datosGuardados = localStorage.getItem('facturacion_borrador');
      if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        
        // Verificar que los datos no sean muy antiguos (más de 24 horas)
        const ahora = new Date().getTime();
        const tiempoGuardado = datos.timestamp || 0;
        const TIEMPO_EXPIRACION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (ahora - tiempoGuardado < TIEMPO_EXPIRACION) {
          // Restaurar datos del formulario
          if (datos.nuevaFactura) {
            this.nuevaFactura = { ...this.nuevaFactura, ...datos.nuevaFactura };
          }
          
          // Restaurar detalles del carrito
          if (datos.detalles && Array.isArray(datos.detalles)) {
            this.detalles = datos.detalles;
            this.calcularTotales();
          }
          
          console.log('Datos del borrador restaurados exitosamente');
        } else {
          // Los datos están expirados, limpiar
          this.limpiarDatosGuardados();
        }
      }
    } catch (error) {
      console.warn('Error al cargar datos guardados:', error);
      this.limpiarDatosGuardados();
    }
  }

  private limpiarDatosGuardados(): void {
    try {
      localStorage.removeItem('facturacion_borrador');
    } catch (error) {
      console.warn('Error al limpiar datos guardados:', error);
    }
  }

  // Método público para limpiar manualmente el borrador
  public limpiarBorrador(): void {
    this.limpiarDatosGuardados();
    this.swal.success('Borrador eliminado');
  }

  // Timer para debounce del guardado automático
  private guardarTimer: any;

  // Método para guardar automáticamente cuando se modifiquen los campos
  public onCampoModificado(): void {
    // Limpiar timer anterior
    if (this.guardarTimer) {
      clearTimeout(this.guardarTimer);
    }
    
    // Establecer nuevo timer con debounce
    this.guardarTimer = setTimeout(() => {
      this.guardarDatos();
    }, 800); // 800ms de debounce
  }

  // ==========================================
  // METODOS DE AUTOCOMPLETADO DE CLIENTE
  // ==========================================

  // Buscar cliente por documento (llamar en blur del input)
  buscarClientePorDocumento() {
    const documento = this.nuevaFactura.numero_documento?.trim();
    
    if (!documento || documento.length < 3) {
      this.clienteEncontrado = null;
      this.clienteEsNuevo = false;
      return;
    }
    
    if (this.nuevaFactura.tipo_documento === 'ninguno') {
      return;
    }
    
    this.buscandoCliente = true;
    
    this.clienteService.buscarPorDocumento(documento).subscribe({
      next: (response: BusquedaClienteResponse) => {
        this.buscandoCliente = false;
        
        if (response.encontrado && response.cliente) {
          this.clienteEncontrado = response.cliente;
          this.clienteEsNuevo = false;
          this.autocompletarDatosCliente(response.cliente);
        } else {
          this.clienteEncontrado = null;
          this.clienteEsNuevo = true;
        }
      },
      error: () => {
        this.buscandoCliente = false;
      }
    });
  }

  autocompletarDatosCliente(cliente: Cliente) {
    this.nuevaFactura.nombre_cliente = cliente.nombre;
    this.nuevaFactura.email_cliente = cliente.email || '';
    this.nuevaFactura.telefono_cliente = cliente.telefono || '';
    this.nuevaFactura.direccion_cliente = cliente.direccion || '';
  }

  limpiarDatosCliente() {
    this.clienteEncontrado = null;
    this.clienteEsNuevo = false;
    this.nuevaFactura.nombre_cliente = '';
    this.nuevaFactura.email_cliente = '';
    this.nuevaFactura.telefono_cliente = '';
    this.nuevaFactura.direccion_cliente = '';
  }

  onExoneradoIvaChange() {
    // Guardar en localStorage para que persista
    localStorage.setItem('exonerado_iva', this.nuevaFactura.exonerado_iva.toString());
    // Recalcular totales
    this.calcularTotales();
    this.onCampoModificado();
  }

  async guardarClienteNuevo() {
    if (!this.clienteEsNuevo || !this.guardarClienteAutomatico) return;
    
    const datosCliente = {
      tipo_documento: this.nuevaFactura.tipo_documento as 'cedula' | 'ruc' | 'ninguno',
      numero_documento: this.nuevaFactura.numero_documento,
      nombre: this.nuevaFactura.nombre_cliente,
      email: this.nuevaFactura.email_cliente || undefined,
      telefono: this.nuevaFactura.telefono_cliente || undefined,
      direccion: this.nuevaFactura.direccion_cliente || undefined
    };
    
    try {
      await this.clienteService.crearDesdeFactura(datosCliente).toPromise();
      console.log('Cliente guardado automaticamente');
    } catch (error) {
      console.warn('No se pudo guardar el cliente:', error);
    }
  }

}
