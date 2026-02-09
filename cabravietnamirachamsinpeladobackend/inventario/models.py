from django.db import models

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

class Subcategoria(models.Model):
    nombre = models.CharField(max_length=100)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='subcategorias')

    class Meta:
        unique_together = ('nombre', 'categoria')

    def __str__(self):
        return f"{self.categoria.nombre} - {self.nombre}"

class Producto(models.Model):
    codigo = models.CharField(max_length=50, unique=True, blank=True, null=True)
    nombre = models.CharField(max_length=200)
    modelo_compatible = models.CharField(max_length=200, blank=True, null=True, help_text="Modelos compatibles, separados por comas.")
    descripcion = models.TextField(blank=True, null=True)
    ubicacion_fisica = models.CharField(max_length=100, blank=True, null=True, help_text="Ubicación física en almacén.")
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    subcategoria = models.ForeignKey(Subcategoria, on_delete=models.SET_NULL, null=True, blank=True, related_name='productos')
    marca = models.CharField(max_length=100, blank=True, null=True)
    unidad_medida = models.CharField(max_length=50, blank=True, null=True)
    stock_disponible = models.PositiveIntegerField(default=0)
    stock_minimo = models.PositiveIntegerField(default=0, help_text="Cantidad mínima recomendada en inventario.")
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Costo al que compras el repuesto.")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    proveedor_principal = models.ForeignKey('Proveedor', on_delete=models.SET_NULL, null=True, blank=True, 
                                          related_name='productos', help_text="Proveedor principal del producto")
    proveedor_texto = models.CharField(max_length=100, blank=True, null=True, 
                                     help_text="Campo de texto para compatibilidad (deprecated)")

    fecha_actualizacion = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=True, help_text="Indica si el producto está activo o inactivo.")

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Movimiento(models.Model):
    TIPO_MOVIMIENTO = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
    ]

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO_MOVIMIENTO)
    cantidad = models.PositiveIntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, help_text="Usuario que realizó el movimiento.")

    def __str__(self):
        return f"{self.tipo.capitalize()} - {self.producto.nombre} ({self.cantidad})"


# Modelos para facturación interna
from django.contrib.auth.models import User

class Cliente(models.Model):
    """
    Modelo para gestionar clientes recurrentes.
    Permite autocompletar datos en facturacion.
    """
    TIPO_DOCUMENTO_CHOICES = [
        ('ninguno', 'Sin documento'),
        ('cedula', 'Cedula de Identidad'),
        ('ruc', 'RUC'),
    ]
    
    # Identificacion
    tipo_documento = models.CharField(
        max_length=10, 
        choices=TIPO_DOCUMENTO_CHOICES, 
        default='cedula'
    )
    numero_documento = models.CharField(
        max_length=30, 
        blank=True,
        null=True,
        help_text='RUC o Cedula de Identidad'
    )
    
    # Datos personales
    nombre = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    # Control
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # Estadisticas (se actualizan automaticamente)
    total_compras = models.PositiveIntegerField(default=0)
    monto_total_compras = models.DecimalField(
        max_digits=15, 
        decimal_places=0, 
        default=0
    )
    
    class Meta:
        ordering = ['nombre']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
    
    def __str__(self):
        if self.numero_documento:
            return f"{self.nombre} ({self.numero_documento})"
        return self.nombre


class Factura(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('ninguno', 'Sin documento'),
        ('cedula', 'Cédula de Identidad'),
        ('ruc', 'RUC'),
    ]
    
    # Datos básicos
    numero_factura = models.CharField(max_length=50, unique=True, blank=True, null=True, 
                                    help_text="Número correlativo de factura")
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Datos del cliente
    tipo_documento = models.CharField(max_length=10, choices=TIPO_DOCUMENTO_CHOICES, default='ninguno')
    numero_documento = models.CharField(max_length=20, blank=True, null=True, 
                                      help_text="Número de cédula o RUC")
    nombre_cliente = models.CharField(max_length=100, blank=True, null=True, 
                                    help_text="Nombre del cliente o razón social")
    email_cliente = models.EmailField(blank=True, null=True, 
                                    help_text="Email (opcional, principalmente para RUC)")
    telefono_cliente = models.CharField(max_length=20, blank=True, null=True)
    direccion_cliente = models.TextField(blank=True, null=True)
    
    # Totales
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exonerado_iva = models.BooleanField(default=False, help_text="Si está exonerado de IVA")
    impuesto_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Control
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.numero_factura:
            # Generar número correlativo automático
            ultimo_numero = Factura.objects.filter(
                numero_factura__isnull=False
            ).order_by('id').last()
            
            if ultimo_numero and ultimo_numero.numero_factura:
                try:
                    ultimo_num = int(ultimo_numero.numero_factura.split('-')[-1])
                    nuevo_num = ultimo_num + 1
                except (ValueError, IndexError):
                    nuevo_num = 1
            else:
                nuevo_num = 1
                
            self.numero_factura = f"FAC-{nuevo_num:06d}"
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Factura #{self.numero_factura} - {self.nombre_cliente or 'Sin cliente'}"

    @property
    def cliente_display(self):
        """Retorna el nombre formateado según el tipo de documento"""
        if self.tipo_documento == 'ruc':
            return f"{self.nombre_cliente} (RUC: {self.numero_documento})"
        elif self.tipo_documento == 'cedula':
            return f"{self.nombre_cliente} (CI: {self.numero_documento})"
        else:
            return self.nombre_cliente or "Cliente sin identificar"

class DetalleFactura(models.Model):
    factura = models.ForeignKey(Factura, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad} (Factura #{self.factura.id})"


# Módulo de Recepción de Mercaderías
class Proveedor(models.Model):
    nombre = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    contacto = models.CharField(max_length=100, blank=True, null=True, help_text="Persona de contacto")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Proveedores"


class OrdenCompra(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial', 'Recibida Parcial'),
        ('completa', 'Recibida Completa'),
        ('cancelada', 'Cancelada'),
    ]
    
    numero_orden = models.CharField(max_length=50, unique=True, help_text="Número de la orden de compra")
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='ordenes_compra')
    fecha_orden = models.DateTimeField(auto_now_add=True)
    fecha_esperada = models.DateField(help_text="Fecha esperada de entrega")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    total_estimado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"OC #{self.numero_orden} - {self.proveedor.nombre}"

    class Meta:
        verbose_name_plural = "Órdenes de Compra"


class DetalleOrdenCompra(models.Model):
    orden_compra = models.ForeignKey(OrdenCompra, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad_solicitada = models.PositiveIntegerField()
    cantidad_recibida = models.PositiveIntegerField(default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad_solicitada} (OC #{self.orden_compra.numero_orden})"

    @property
    def cantidad_pendiente(self):
        return self.cantidad_solicitada - self.cantidad_recibida

    @property
    def esta_completo(self):
        return self.cantidad_recibida >= self.cantidad_solicitada


class RecepcionMercaderia(models.Model):
    numero_recepcion = models.CharField(max_length=50, unique=True, help_text="Número de recepción interno")
    orden_compra = models.ForeignKey(OrdenCompra, on_delete=models.PROTECT, related_name='recepciones', blank=True, null=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT)
    fecha_recepcion = models.DateTimeField(auto_now_add=True)
    numero_remito = models.CharField(max_length=100, blank=True, null=True, help_text="Número de remito del proveedor")
    observaciones = models.TextField(blank=True, null=True)
    usuario_recepcion = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Recepción #{self.numero_recepcion} - {self.proveedor.nombre}"

    class Meta:
        verbose_name_plural = "Recepciones de Mercadería"


class DetalleRecepcion(models.Model):
    recepcion = models.ForeignKey(RecepcionMercaderia, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad_recibida = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio según factura del proveedor")
    lote = models.CharField(max_length=100, blank=True, null=True, help_text="Número de lote o serie")
    fecha_vencimiento = models.DateField(blank=True, null=True, help_text="Fecha de vencimiento (si aplica)")

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad_recibida} (Recepción #{self.recepcion.numero_recepcion})"


# Modelo para manejar múltiples proveedores por producto
class ProductoProveedor(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='proveedores')
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='productos_suministrados')
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio al que el proveedor vende este producto")
    es_principal = models.BooleanField(default=False, help_text="¿Es el proveedor principal para este producto?")
    tiempo_entrega_dias = models.PositiveIntegerField(default=0, help_text="Días de entrega estimados")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('producto', 'proveedor')
        verbose_name_plural = "Productos - Proveedores"

    def __str__(self):
        principal = " (Principal)" if self.es_principal else ""
        return f"{self.producto.nombre} - {self.proveedor.nombre}{principal}"


# Módulo de Facturas de Compra (recibidas de proveedores)
class FacturaCompra(models.Model):
    """
    Facturas de compra recibidas de proveedores.
    Registra el costo de adquisición de mercadería.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de Pago'),
        ('pagada', 'Pagada'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]
    
    TIPO_FACTURA_CHOICES = [
        ('contado', 'Contado'),
        ('credito', 'Crédito'),
    ]
    
    # Información de la factura
    numero_factura = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Número de factura del proveedor"
    )
    proveedor = models.ForeignKey(
        Proveedor, 
        on_delete=models.PROTECT, 
        related_name='facturas_compra'
    )
    orden_compra = models.ForeignKey(
        OrdenCompra,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_compra',
        help_text="Orden de compra relacionada (opcional)"
    )
    
    # Fechas
    fecha_emision = models.DateField(help_text="Fecha de emisión de la factura")
    fecha_recepcion = models.DateTimeField(
        auto_now_add=True, 
        help_text="Fecha en que se registró en el sistema"
    )
    fecha_vencimiento = models.DateField(
        null=True, 
        blank=True, 
        help_text="Fecha de vencimiento para pago"
    )
    
    # Tipo y estado
    tipo_factura = models.CharField(
        max_length=20, 
        choices=TIPO_FACTURA_CHOICES, 
        default='contado'
    )
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='pendiente'
    )
    
    # Montos
    subtotal = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Suma de todos los items"
    )
    descuento = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Descuento aplicado"
    )
    impuestos = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="IVA y otros impuestos"
    )
    total = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Total de la factura"
    )
    
    # Información adicional
    timbrado = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Número de timbrado de la factura"
    )
    condicion_pago = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Ej: 30 días, 60 días, etc."
    )
    observaciones = models.TextField(blank=True, null=True)
    
    # Archivo adjunto (opcional)
    archivo_adjunto = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Ruta o URL del archivo escaneado de la factura"
    )
    
    # Control
    usuario_registro = models.ForeignKey(
        'auth.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Usuario que registró la factura"
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha_emision', '-numero_factura']
        verbose_name = 'Factura de Compra'
        verbose_name_plural = 'Facturas de Compra'
        indexes = [
            models.Index(fields=['proveedor', '-fecha_emision']),
            models.Index(fields=['estado', '-fecha_emision']),
            models.Index(fields=['fecha_vencimiento']),
        ]
    
    def __str__(self):
        return f"FC {self.numero_factura} - {self.proveedor.nombre} - ₲{self.total:,.0f}"
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.subtotal - self.descuento + self.impuestos
        super().save(*args, **kwargs)
    
    @property
    def esta_vencida(self):
        """Verifica si la factura está vencida"""
        from django.utils import timezone
        if self.fecha_vencimiento and self.estado == 'pendiente':
            return timezone.now().date() > self.fecha_vencimiento
        return False
    
    @property
    def dias_para_vencimiento(self):
        """Calcula cuántos días faltan para el vencimiento"""
        from django.utils import timezone
        if self.fecha_vencimiento and self.estado == 'pendiente':
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None


class DetalleFacturaCompra(models.Model):
    """
    Detalle de items en una factura de compra.
    """
    factura_compra = models.ForeignKey(
        FacturaCompra, 
        related_name='detalles', 
        on_delete=models.CASCADE
    )
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.PROTECT,
        help_text="Producto comprado"
    )
    descripcion = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        help_text="Descripción adicional del item"
    )
    cantidad = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Cantidad comprada"
    )
    precio_unitario = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        help_text="Precio unitario de compra"
    )
    subtotal = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        help_text="cantidad * precio_unitario"
    )
    
    # Información adicional del lote
    lote = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Número de lote"
    )
    fecha_vencimiento_lote = models.DateField(
        blank=True, 
        null=True,
        help_text="Fecha de vencimiento del lote"
    )
    
    class Meta:
        verbose_name = 'Detalle de Factura de Compra'
        verbose_name_plural = 'Detalles de Facturas de Compra'
    
    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad} - FC {self.factura_compra.numero_factura}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)