from django.contrib import admin
from .models import (
    Categoria, Subcategoria, Producto, Movimiento, Cliente,
    Factura, DetalleFactura, Proveedor, OrdenCompra, 
    DetalleOrdenCompra, RecepcionMercaderia, DetalleRecepcion,
    ProductoProveedor, FacturaCompra, DetalleFacturaCompra
)

# Configuración de administración para modelos básicos
admin.site.register(Categoria)
admin.site.register(Subcategoria)
admin.site.register(Producto)
admin.site.register(Movimiento)
admin.site.register(Cliente)

# Administración de facturación
class DetalleFacturaInline(admin.TabularInline):
    model = DetalleFactura
    extra = 1

@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ['numero_factura', 'nombre_cliente', 'tipo_documento', 'numero_documento', 'total', 'fecha']
    list_filter = ['tipo_documento', 'fecha', 'exonerado_iva']
    search_fields = ['numero_factura', 'nombre_cliente', 'numero_documento']
    inlines = [DetalleFacturaInline]

# Administración de proveedores y compras
@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'telefono', 'email', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'email', 'contacto']

class DetalleOrdenCompraInline(admin.TabularInline):
    model = DetalleOrdenCompra
    extra = 1

@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    list_display = ['numero_orden', 'proveedor', 'fecha_orden', 'fecha_esperada', 'estado', 'total_estimado']
    list_filter = ['estado', 'fecha_orden']
    search_fields = ['numero_orden', 'proveedor__nombre']
    inlines = [DetalleOrdenCompraInline]

class DetalleRecepcionInline(admin.TabularInline):
    model = DetalleRecepcion
    extra = 1

@admin.register(RecepcionMercaderia)
class RecepcionMercaderiaAdmin(admin.ModelAdmin):
    list_display = ['numero_recepcion', 'proveedor', 'orden_compra', 'fecha_recepcion', 'numero_remito']
    list_filter = ['fecha_recepcion', 'proveedor']
    search_fields = ['numero_recepcion', 'numero_remito', 'proveedor__nombre']
    inlines = [DetalleRecepcionInline]

@admin.register(ProductoProveedor)
class ProductoProveedorAdmin(admin.ModelAdmin):
    list_display = ['producto', 'proveedor', 'precio_compra', 'es_principal', 'activo']
    list_filter = ['es_principal', 'activo', 'proveedor']
    search_fields = ['producto__nombre', 'proveedor__nombre']

# Administración de facturas de compra
class DetalleFacturaCompraInline(admin.TabularInline):
    model = DetalleFacturaCompra
    extra = 1
    readonly_fields = ['subtotal']

@admin.register(FacturaCompra)
class FacturaCompraAdmin(admin.ModelAdmin):
    list_display = ['numero_factura', 'proveedor', 'fecha_emision', 'fecha_vencimiento', 
                    'tipo_factura', 'estado', 'total', 'esta_vencida']
    list_filter = ['estado', 'tipo_factura', 'fecha_emision', 'proveedor']
    search_fields = ['numero_factura', 'proveedor__nombre', 'timbrado']
    readonly_fields = ['fecha_recepcion', 'total', 'esta_vencida', 'dias_para_vencimiento']
    fieldsets = (
        ('Información de la Factura', {
            'fields': ('numero_factura', 'proveedor', 'orden_compra', 'timbrado')
        }),
        ('Fechas', {
            'fields': ('fecha_emision', 'fecha_recepcion', 'fecha_vencimiento', 
                      'dias_para_vencimiento', 'esta_vencida')
        }),
        ('Tipo y Estado', {
            'fields': ('tipo_factura', 'estado')
        }),
        ('Montos', {
            'fields': ('subtotal', 'descuento', 'impuestos', 'total')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
    )
    inlines = [DetalleFacturaCompraInline]

@admin.register(DetalleFacturaCompra)
class DetalleFacturaCompraAdmin(admin.ModelAdmin):
    list_display = ['factura_compra', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['factura_compra__proveedor', 'factura_compra__fecha_emision']
    search_fields = ['factura_compra__numero_factura', 'producto__nombre']
    readonly_fields = ['subtotal']
