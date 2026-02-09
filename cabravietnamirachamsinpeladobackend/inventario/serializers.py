from rest_framework import serializers
from decimal import Decimal
from .models import (
    Categoria, Subcategoria, Producto, Movimiento, Factura, DetalleFactura, 
    Proveedor, Cliente, FacturaCompra, DetalleFacturaCompra,
    OrdenCompra, DetalleOrdenCompra, RecepcionMercaderia, DetalleRecepcion
)

# ==========================================
# SERIALIZERS DE CLIENTE
# ==========================================

class ClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para CRUD de clientes"""
    
    class Meta:
        model = Cliente
        fields = [
            'id',
            'tipo_documento',
            'numero_documento',
            'nombre',
            'email',
            'telefono',
            'direccion',
            'activo',
            'fecha_registro',
            'fecha_actualizacion',
            'total_compras',
            'monto_total_compras'
        ]
        read_only_fields = [
            'fecha_registro', 
            'fecha_actualizacion',
            'total_compras',
            'monto_total_compras'
        ]


class ClienteDropdownSerializer(serializers.ModelSerializer):
    """Serializer ligero para autocompletado"""
    class Meta:
        model = Cliente
        fields = [
            'id',
            'tipo_documento',
            'numero_documento',
            'nombre',
            'email',
            'telefono',
            'direccion'
        ]


# Serializers para facturación
class DetalleFacturaSerializer(serializers.ModelSerializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())

    class Meta:
        model = DetalleFactura
        fields = ['producto', 'cantidad', 'precio_unitario', 'subtotal']


class FacturaSerializer(serializers.ModelSerializer):
    detalles = DetalleFacturaSerializer(many=True)
    usuario = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    def validate(self, data):
        """Validaciones personalizadas para RUC y Cédula"""
        tipo_documento = data.get('tipo_documento')
        numero_documento = data.get('numero_documento')
        
        if tipo_documento == 'ruc':
            if not numero_documento:
                raise serializers.ValidationError("El número de RUC es requerido")
            # Solo validar que tenga guión
            if '-' not in numero_documento:
                raise serializers.ValidationError("El RUC debe contener un guión (-)")
        
        elif tipo_documento == 'cedula':
            if not numero_documento:
                raise serializers.ValidationError("El número de cédula es requerido")
            # Sin validaciones de longitud o formato, solo que no esté vacío
        
        return data

    class Meta:
        model = Factura
        fields = ['id', 'numero_factura', 'fecha', 'tipo_documento', 'numero_documento', 
                 'nombre_cliente', 'email_cliente', 'telefono_cliente', 'direccion_cliente',
                 'subtotal', 'descuento_total', 'exonerado_iva', 'impuesto_total', 'total', 'usuario', 
                 'observaciones', 'detalles']
        read_only_fields = ['id', 'numero_factura', 'fecha', 'usuario', 'subtotal', 'impuesto_total', 'total']

    def create(self, validated_data):
        """
        Crea una factura con transacción atómica.
        El stock se actualiza AUTOMÁTICAMENTE via signal post_save de Movimiento.
        """
        from django.db import transaction
        from decimal import Decimal, ROUND_HALF_UP
        from .models import Movimiento, DetalleFactura
        
        # ═══════════════════════════════════════════════════════════
        # CONFIGURACIÓN DE PARAGUAY
        # ═══════════════════════════════════════════════════════════
        TASA_IVA = Decimal('0.10')  # 10% Paraguay
        
        with transaction.atomic():
            detalles_data = validated_data.pop('detalles')
            usuario = self.context.get('request').user if 'request' in self.context else None
            
            # Limpiar campos que serán calculados
            validated_data.pop('usuario', None)
            validated_data.pop('subtotal', None)
            validated_data.pop('total', None)
            validated_data.pop('impuesto_total', None)
            
            # ═══════════════════════════════════════════════════════════
            # FASE 1: PRE-VALIDACIÓN COMPLETA (antes de crear registros)
            # ═══════════════════════════════════════════════════════════
            for detalle in detalles_data:
                producto = detalle['producto']
                cantidad = detalle['cantidad']
                
                # Refrescar desde DB (evita problemas de concurrencia)
                producto.refresh_from_db()
                
                # Validar stock
                if producto.stock_disponible < cantidad:
                    raise serializers.ValidationError({
                        'detalles': f"Stock insuficiente para '{producto.nombre}'. "
                                    f"Disponible: {producto.stock_disponible}, "
                                    f"Solicitado: {cantidad}"
                    })
                
                # Validar precio
                precio = detalle.get('precio_unitario', producto.precio_unitario)
                if not precio or precio <= 0:
                    raise serializers.ValidationError({
                        'detalles': f"Precio inválido para '{producto.nombre}'"
                    })
            
            # ═══════════════════════════════════════════════════════════
            # FASE 2: CREAR FACTURA (con totales temporales)
            # ═══════════════════════════════════════════════════════════
            factura = Factura.objects.create(
                usuario=usuario,
                subtotal=Decimal('0'),
                impuesto_total=Decimal('0'),
                total=Decimal('0'),
                **validated_data
            )
            
            # ═══════════════════════════════════════════════════════════
            # FASE 3: PROCESAR DETALLES
            # ═══════════════════════════════════════════════════════════
            subtotal_acumulado = Decimal('0')
            
            for detalle in detalles_data:
                producto = detalle['producto']
                cantidad = detalle['cantidad']
                precio_unitario = detalle.get('precio_unitario', producto.precio_unitario)
                
                # Convertir a Decimal con precisión
                precio_unitario = Decimal(str(precio_unitario))
                cantidad_decimal = Decimal(str(cantidad))
                
                # Calcular subtotal del detalle con redondeo
                subtotal_detalle = (cantidad_decimal * precio_unitario).quantize(
                    Decimal('0.01'), 
                    rounding=ROUND_HALF_UP
                )
                
                # Crear detalle de factura
                DetalleFactura.objects.create(
                    factura=factura,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal_detalle
                )
                
                # ⚠️ CRÍTICO: NO modificar stock aquí
                # El signal post_save de Movimiento se encarga automáticamente
                Movimiento.objects.create(
                    producto=producto,
                    tipo='salida',
                    cantidad=cantidad,
                    descripcion=f"Venta - Factura #{factura.numero_factura}",
                    usuario=usuario
                )
                
                subtotal_acumulado += subtotal_detalle
            
            # ═══════════════════════════════════════════════════════════
            # FASE 4: CALCULAR TOTALES FINALES
            # ═══════════════════════════════════════════════════════════
            descuento_total = Decimal(str(validated_data.get('descuento_total', 0)))
            
            # Subtotal después de descuento (base imponible)
            base_imponible = (subtotal_acumulado - descuento_total).quantize(
                Decimal('0.01'),
                rounding=ROUND_HALF_UP
            )
            
            # Calcular IVA 10% sobre base imponible (solo si no está exonerado)
            exonerado_iva = validated_data.get('exonerado_iva', False)
            if exonerado_iva:
                impuesto_total = Decimal('0.00')
            else:
                impuesto_total = (base_imponible * TASA_IVA).quantize(
                    Decimal('0.01'),
                    rounding=ROUND_HALF_UP
                )
            
            # Total final
            total_final = base_imponible + impuesto_total
            
            # Actualizar factura con totales calculados
            factura.subtotal = subtotal_acumulado
            factura.descuento_total = descuento_total
            factura.exonerado_iva = exonerado_iva
            factura.impuesto_total = impuesto_total
            factura.total = total_final
            factura.save()
            
            return factura


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class SubcategoriaSerializer(serializers.ModelSerializer):
    categoria = serializers.StringRelatedField()
    class Meta:
        model = Subcategoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # Campo para aceptar nombre de categoría en texto (compatibilidad)
    categoria_texto = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Producto
        fields = '__all__'
        extra_kwargs = {
            'categoria': {'required': False},  # No requerido porque usamos categoria_texto
            'codigo': {'required': False},  # Código no obligatorio
            'precio_unitario': {'required': False},  # Se calcula automáticamente a partir de precio_costo
        }
    
    def to_representation(self, instance):
        """Personalizar la salida para mostrar nombres en lugar de IDs"""
        data = super().to_representation(instance)
        # Convertir IDs a nombres para lectura
        if instance.categoria:
            data['categoria'] = instance.categoria.nombre
        if instance.subcategoria:
            data['subcategoria'] = instance.subcategoria.nombre
        if instance.proveedor_principal:
            data['proveedor_principal'] = instance.proveedor_principal.nombre
        return data
    
    def create(self, validated_data):
        """Procesar categoria_texto y crear el producto"""
        categoria_texto = validated_data.pop('categoria_texto', None)
        
        if categoria_texto:
            # Si viene texto, buscar o crear la categoría
            categoria, _ = Categoria.objects.get_or_create(nombre=categoria_texto.upper())
            validated_data['categoria'] = categoria
        elif 'categoria' not in validated_data or validated_data.get('categoria') is None:
            # Si no hay categoría en absoluto, usar por defecto
            categoria_default, _ = Categoria.objects.get_or_create(nombre='SIN CATEGORÍA')
            validated_data['categoria'] = categoria_default
        
        # Calcular precio_unitario automáticamente (precio_costo + 30%)
        if 'precio_costo' in validated_data:
            precio_costo = validated_data['precio_costo']
            validated_data['precio_unitario'] = precio_costo * Decimal('1.30')
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar producto y recalcular precio_unitario si cambió precio_costo"""
        categoria_texto = validated_data.pop('categoria_texto', None)
        
        if categoria_texto:
            categoria, _ = Categoria.objects.get_or_create(nombre=categoria_texto.upper())
            validated_data['categoria'] = categoria
        
        # Calcular precio_unitario automáticamente si cambia precio_costo
        if 'precio_costo' in validated_data:
            precio_costo = validated_data['precio_costo']
            validated_data['precio_unitario'] = precio_costo * Decimal('1.30')
        
        return super().update(instance, validated_data)

class MovimientoSerializer(serializers.ModelSerializer):
    producto = serializers.StringRelatedField()
    class Meta:
        model = Movimiento
        fields = '__all__'


# Serializers para el módulo de recepción de mercaderías
from .models import Proveedor, OrdenCompra, DetalleOrdenCompra, RecepcionMercaderia, DetalleRecepcion, ProductoProveedor

class ProveedorSerializer(serializers.ModelSerializer):
    productos_suministrados = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Proveedor
        fields = '__all__'


class ProductoProveedorSerializer(serializers.ModelSerializer):
    producto = serializers.StringRelatedField(read_only=True)
    proveedor = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ProductoProveedor
        fields = ['id', 'producto', 'proveedor', 'precio_compra', 'es_principal', 
                 'tiempo_entrega_dias', 'activo', 'fecha_creacion']


class DetalleOrdenCompraSerializer(serializers.ModelSerializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad_pendiente = serializers.ReadOnlyField()
    esta_completo = serializers.ReadOnlyField()

    class Meta:
        model = DetalleOrdenCompra
        fields = ['id', 'producto', 'cantidad_solicitada', 'cantidad_recibida', 
                 'precio_unitario', 'subtotal', 'cantidad_pendiente', 'esta_completo']


class OrdenCompraSerializer(serializers.ModelSerializer):
    detalles = DetalleOrdenCompraSerializer(many=True)
    proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all())
    usuario = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = OrdenCompra
        fields = ['id', 'numero_orden', 'proveedor', 'fecha_orden', 'fecha_esperada', 
                 'estado', 'total_estimado', 'observaciones', 'usuario', 'detalles']
        read_only_fields = ['id', 'fecha_orden']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        usuario = self.context['request'].user if 'request' in self.context else None
        validated_data.pop('usuario', None)
        orden = OrdenCompra.objects.create(usuario=usuario, **validated_data)
        
        total = 0
        for detalle in detalles_data:
            producto = detalle['producto']
            cantidad = detalle['cantidad_solicitada']
            precio = detalle['precio_unitario']
            subtotal = cantidad * float(precio)
            DetalleOrdenCompra.objects.create(
                orden_compra=orden, 
                producto=producto, 
                cantidad_solicitada=cantidad,
                precio_unitario=precio,
                subtotal=subtotal
            )
            total += subtotal
        
        orden.total_estimado = total
        orden.save()
        return orden


class DetalleRecepcionSerializer(serializers.ModelSerializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())

    class Meta:
        model = DetalleRecepcion
        fields = ['id', 'producto', 'cantidad_recibida', 'precio_unitario', 'lote', 'fecha_vencimiento']


class RecepcionMercaderiaSerializer(serializers.ModelSerializer):
    detalles = DetalleRecepcionSerializer(many=True)
    proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all())
    usuario_recepcion = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = RecepcionMercaderia
        fields = ['id', 'numero_recepcion', 'orden_compra', 'proveedor', 'fecha_recepcion', 
                 'numero_remito', 'observaciones', 'usuario_recepcion', 'detalles']
        read_only_fields = ['id', 'fecha_recepcion']

    def create(self, validated_data):
        """
        Crea una recepción de mercadería.
        El stock se actualiza AUTOMÁTICAMENTE via signal post_save de Movimiento.
        """
        from .models import Movimiento
        
        detalles_data = validated_data.pop('detalles')
        usuario = self.context['request'].user if 'request' in self.context else None
        validated_data.pop('usuario_recepcion', None)
        recepcion = RecepcionMercaderia.objects.create(usuario_recepcion=usuario, **validated_data)
        
        for detalle in detalles_data:
            producto = detalle['producto']
            cantidad = detalle['cantidad_recibida']
            precio_costo = detalle.get('precio_unitario')
            
            # Crear el detalle de recepción
            DetalleRecepcion.objects.create(recepcion=recepcion, **detalle)
            
            # Actualizar precio de costo y recalcular precio de venta
            if precio_costo:
                producto.precio_costo = precio_costo
                producto.precio_unitario = precio_costo * Decimal('1.30')  # +30%
                producto.save()
            
            # ⚠️ CRÍTICO: NO modificar stock aquí
            # El signal post_save de Movimiento se encarga automáticamente
            
            # Crear movimiento de entrada
            Movimiento.objects.create(
                producto=producto,
                tipo='entrada',
                cantidad=cantidad,
                descripcion=f"Recepción #{recepcion.numero_recepcion}",
                usuario=usuario
            )
            
            # Si hay orden de compra, actualizar cantidad recibida
            if recepcion.orden_compra:
                try:
                    detalle_orden = DetalleOrdenCompra.objects.get(
                        orden_compra=recepcion.orden_compra,
                        producto=producto
                    )
                    detalle_orden.cantidad_recibida += cantidad
                    detalle_orden.save()
                except DetalleOrdenCompra.DoesNotExist:
                    pass
        
        return recepcion


# ==========================================
# SERIALIZERS DE FACTURAS DE COMPRA
# ==========================================

class DetalleFacturaCompraSerializer(serializers.ModelSerializer):
    """Serializer para los detalles de facturas de compra"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    
    class Meta:
        model = DetalleFacturaCompra
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'producto_codigo',
            'descripcion',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'lote',
            'fecha_vencimiento_lote'
        ]
        read_only_fields = ['id', 'subtotal', 'producto_nombre', 'producto_codigo']


class FacturaCompraListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listado de facturas de compra"""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    orden_compra_numero = serializers.CharField(source='orden_compra.numero_orden', read_only=True, allow_null=True)
    dias_vencimiento = serializers.IntegerField(source='dias_para_vencimiento', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FacturaCompra
        fields = [
            'id',
            'numero_factura',
            'proveedor',
            'proveedor_nombre',
            'orden_compra',
            'orden_compra_numero',
            'fecha_emision',
            'fecha_vencimiento',
            'tipo_factura',
            'estado',
            'total',
            'dias_vencimiento',
            'esta_vencida'
        ]


class FacturaCompraDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para crear/editar facturas de compra"""
    detalles = DetalleFacturaCompraSerializer(many=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    orden_compra_numero = serializers.CharField(source='orden_compra.numero_orden', read_only=True, allow_null=True)
    usuario_registro = serializers.HiddenField(default=serializers.CurrentUserDefault())
    dias_vencimiento = serializers.IntegerField(source='dias_para_vencimiento', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FacturaCompra
        fields = [
            'id',
            'numero_factura',
            'proveedor',
            'proveedor_nombre',
            'orden_compra',
            'orden_compra_numero',
            'fecha_emision',
            'fecha_recepcion',
            'fecha_vencimiento',
            'tipo_factura',
            'estado',
            'subtotal',
            'descuento',
            'impuestos',
            'total',
            'timbrado',
            'condicion_pago',
            'observaciones',
            'archivo_adjunto',
            'usuario_registro',
            'fecha_actualizacion',
            'detalles',
            'dias_vencimiento',
            'esta_vencida'
        ]
        read_only_fields = [
            'id',
            'fecha_recepcion',
            'fecha_actualizacion',
            'total',
            'proveedor_nombre',
            'orden_compra_numero',
            'dias_vencimiento',
            'esta_vencida'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que si es crédito, debe tener fecha de vencimiento
        if data.get('tipo_factura') == 'credito' and not data.get('fecha_vencimiento'):
            raise serializers.ValidationError({
                'fecha_vencimiento': 'Las facturas a crédito deben tener fecha de vencimiento'
            })
        
        # Validar que tenga al menos un detalle
        if 'detalles' in data and len(data['detalles']) == 0:
            raise serializers.ValidationError({
                'detalles': 'La factura debe tener al menos un detalle'
            })
        
        return data
    
    def create(self, validated_data):
        """Crear factura de compra con sus detalles"""
        from decimal import Decimal
        
        detalles_data = validated_data.pop('detalles')
        usuario = self.context['request'].user if 'request' in self.context else None
        validated_data.pop('usuario_registro', None)
        
        # Calcular subtotal de los detalles
        subtotal_calculado = Decimal('0.00')
        for detalle_data in detalles_data:
            cantidad = Decimal(str(detalle_data['cantidad']))
            precio = Decimal(str(detalle_data['precio_unitario']))
            subtotal_calculado += cantidad * precio
        
        # Si no se proporcionó subtotal, usar el calculado
        if 'subtotal' not in validated_data or validated_data['subtotal'] == 0:
            validated_data['subtotal'] = subtotal_calculado
        
        # Crear la factura
        factura = FacturaCompra.objects.create(
            usuario_registro=usuario,
            **validated_data
        )
        
        # Crear los detalles
        for detalle_data in detalles_data:
            DetalleFacturaCompra.objects.create(
                factura_compra=factura,
                **detalle_data
            )
        
        return factura
    
    def update(self, instance, validated_data):
        """Actualizar factura de compra y sus detalles"""
        from decimal import Decimal
        
        detalles_data = validated_data.pop('detalles', None)
        
        # Actualizar campos de la factura
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Si se enviaron detalles, reemplazarlos
        if detalles_data is not None:
            # Eliminar detalles existentes
            instance.detalles.all().delete()
            
            # Crear nuevos detalles
            subtotal_calculado = Decimal('0.00')
            for detalle_data in detalles_data:
                DetalleFacturaCompra.objects.create(
                    factura_compra=instance,
                    **detalle_data
                )
                cantidad = Decimal(str(detalle_data['cantidad']))
                precio = Decimal(str(detalle_data['precio_unitario']))
                subtotal_calculado += cantidad * precio
            
            # Actualizar subtotal si cambió
            instance.subtotal = subtotal_calculado
        
        instance.save()
        return instance