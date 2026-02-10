from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Producto, Cliente
from django.db import models, connection
from .serializers import ProductoSerializer, ClienteSerializer, ClienteDropdownSerializer
from .pagination import LargePagination

# ==========================================
# ENDPOINT DE HEALTH CHECK (Sin autenticación)
# ==========================================
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de verificación de salud del sistema.
    Verifica que Django esté corriendo y que la conexión a PostgreSQL funcione.
    """
    try:
        # Intentar consulta simple a la base de datos
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'service': 'backend'
        }, status=200)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }, status=503)

# ==========================================
# ENDPOINTS PROTEGIDOS
# ==========================================

# Endpoint para productos con stock bajo
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_stock_bajo(request):
    productos = Producto.objects.filter(stock_disponible__lte=models.F('stock_minimo'))
    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data)
from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Categoria, Subcategoria, Producto, Movimiento
from .serializers import CategoriaSerializer, SubcategoriaSerializer, ProductoSerializer, MovimientoSerializer
from .models import Factura, DetalleFactura
from .serializers import FacturaSerializer


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "¡Acceso autorizado!"})


from rest_framework.permissions import IsAuthenticated

class CategoriaViewSet(ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]


class SubcategoriaViewSet(ModelViewSet):
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated]


class ProductoViewSet(ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]



class MovimientoViewSet(ModelViewSet):
    """
    API endpoint para movimientos de inventario.

    Filtros disponibles (como parámetros de la URL):
    - producto: ID del producto (ej: ?producto=1)
    - tipo: 'entrada', 'salida' (ej: ?tipo=entrada)
    - usuario: ID del usuario (ej: ?usuario=2)
    - fecha: filtra por fecha exacta (ej: ?fecha=2025-07-30)
    - fecha__gte, fecha__lte: filtra por rango de fechas (ej: ?fecha__gte=2025-07-01&fecha__lte=2025-07-30)
    - search: busca en la descripción (ej: ?search=ajuste)
    - ordering: ordena por fecha o cantidad (ej: ?ordering=-fecha)

    Ejemplo de uso:
    /api/movimientos/?producto=1&tipo=salida&usuario=2&fecha__gte=2025-07-01&fecha__lte=2025-07-30&search=venta&ordering=-fecha
    """
    queryset = Movimiento.objects.all()
    serializer_class = MovimientoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['producto', 'tipo', 'usuario']
    search_fields = ['descripcion']
    ordering_fields = ['fecha', 'cantidad']

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ViewSet para facturación interna
class FacturaViewSet(ModelViewSet):
    queryset = Factura.objects.all().order_by('-fecha')
    serializer_class = FacturaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def datos_completos(self, request, pk=None):
        """
        Endpoint para obtener todos los datos de una factura 
        formateados para generar PDF en el frontend
        """
        try:
            factura = self.get_object()
            
            # Formatear los datos para el PDF
            datos_factura = {
                'numero_factura': factura.numero_factura,
                'fecha': factura.fecha.strftime('%d/%m/%Y'),
                'hora': factura.fecha.strftime('%H:%M:%S'),
                
                # Datos del cliente
                'cliente': {
                    'tipo_documento': factura.get_tipo_documento_display(),
                    'numero_documento': factura.numero_documento,
                    'nombre': factura.nombre_cliente,
                    'email': factura.email_cliente,
                    'telefono': factura.telefono_cliente,
                    'direccion': factura.direccion_cliente,
                },
                
                # Detalles de productos
                'detalles': [],
                
                # Totales
                'subtotal': float(factura.subtotal),
                'descuento_total': float(factura.descuento_total),
                'impuesto_total': float(factura.impuesto_total),
                'total': float(factura.total),
                'observaciones': factura.observaciones,
                
                # Datos del usuario que creó la factura
                'vendedor': {
                    'nombre': f"{factura.usuario.first_name} {factura.usuario.last_name}".strip() or factura.usuario.username,
                    'username': factura.usuario.username
                }
            }
            
            # Agregar detalles de productos
            for detalle in factura.detalles.all():
                datos_factura['detalles'].append({
                    'producto': detalle.producto.nombre,
                    'codigo': detalle.producto.codigo,
                    'descripcion': detalle.producto.descripcion,
                    'cantidad': int(detalle.cantidad),
                    'precio_unitario': float(detalle.precio_unitario),
                    'subtotal': float(detalle.subtotal),
                    'categoria': detalle.producto.categoria.nombre if detalle.producto.categoria else '',
                    'marca': detalle.producto.marca or ''
                })
            
            return Response(datos_factura)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener datos de factura: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# ViewSets para módulo de recepción de mercaderías
from .models import Proveedor, OrdenCompra, RecepcionMercaderia
from .serializers import ProveedorSerializer, OrdenCompraSerializer, RecepcionMercaderiaSerializer

class ProveedorViewSet(ModelViewSet):
    """
    API endpoint para gestión de proveedores.
    
    Filtros disponibles:
    - activo: true/false (ej: ?activo=true)
    - search: busca en nombre, contacto, email (ej: ?search=ferreteria)
    """
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'contacto', 'email']
    ordering_fields = ['nombre', 'fecha_creacion']


class OrdenCompraViewSet(ModelViewSet):
    """
    API endpoint para órdenes de compra.
    
    Filtros disponibles:
    - proveedor: ID del proveedor (ej: ?proveedor=1)
    - estado: pendiente, parcial, completa, cancelada (ej: ?estado=pendiente)
    - fecha_orden: filtro por fecha (ej: ?fecha_orden__gte=2025-01-01)
    """
    queryset = OrdenCompra.objects.all().order_by('-fecha_orden')
    serializer_class = OrdenCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proveedor', 'estado']
    search_fields = ['numero_orden', 'observaciones']
    ordering_fields = ['fecha_orden', 'fecha_esperada', 'total_estimado']


class RecepcionMercaderiaViewSet(ModelViewSet):
    """
    API endpoint para recepción de mercaderías.
    
    Al crear una recepción, automáticamente:
    - Actualiza el stock de los productos recibidos
    - Crea movimientos de entrada en el inventario
    - Actualiza las cantidades recibidas en las órdenes de compra (si aplica)
    
    Filtros disponibles:
    - proveedor: ID del proveedor (ej: ?proveedor=1)
    - orden_compra: ID de la orden de compra (ej: ?orden_compra=1)
    - fecha_recepcion: filtro por fecha (ej: ?fecha_recepcion__gte=2025-01-01)
    """
    queryset = RecepcionMercaderia.objects.all().order_by('-fecha_recepcion')
    serializer_class = RecepcionMercaderiaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proveedor', 'orden_compra']
    search_fields = ['numero_recepcion', 'numero_remito', 'observaciones']
    ordering_fields = ['fecha_recepcion']


# ViewSet para gestionar relaciones producto-proveedor
from .models import ProductoProveedor
from .serializers import ProductoProveedorSerializer

class ProductoProveedorViewSet(ModelViewSet):
    """
    API endpoint para gestionar qué proveedores suministran cada producto.
    
    Permite:
    - Ver todos los proveedores de un producto específico
    - Asignar proveedores a productos
    - Establecer precios por proveedor
    - Marcar proveedor principal
    
    Filtros disponibles:
    - producto: ID del producto (ej: ?producto=1)
    - proveedor: ID del proveedor (ej: ?proveedor=1)
    - es_principal: true/false (ej: ?es_principal=true)
    - activo: true/false (ej: ?activo=true)
    """
    queryset = ProductoProveedor.objects.all()
    serializer_class = ProductoProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['producto', 'proveedor', 'es_principal', 'activo']


# ==========================================
# VIEWSET DE CLIENTES
# ==========================================

class ClienteViewSet(ModelViewSet):
    """
    CRUD completo para gestion de clientes.
    Incluye busqueda por documento para autocompletado.
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_documento', 'activo']
    search_fields = ['nombre', 'numero_documento', 'email', 'telefono']
    ordering_fields = ['nombre', 'fecha_registro', 'total_compras']
    ordering = ['nombre']
    
    @action(detail=False, methods=['get'])
    def buscar_por_documento(self, request):
        """
        Busca cliente por numero de documento.
        Usado para autocompletado en facturacion.
        GET /api/clientes/buscar_por_documento/?documento=123456
        """
        documento = request.query_params.get('documento', '').strip()
        
        if not documento:
            return Response(
                {'error': 'Parametro "documento" requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(numero_documento=documento, activo=True)
            serializer = ClienteDropdownSerializer(cliente)
            return Response({
                'encontrado': True,
                'cliente': serializer.data
            })
        except Cliente.DoesNotExist:
            return Response({
                'encontrado': False,
                'mensaje': 'Cliente no registrado'
            })
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """
        Lista de clientes para selectores (sin paginacion).
        """
        clientes = Cliente.objects.filter(activo=True).values(
            'id', 'nombre', 'numero_documento', 'tipo_documento'
        ).order_by('nombre')
        return Response(list(clientes))
    
    @action(detail=False, methods=['post'])
    def crear_desde_factura(self, request):
        """
        Crea un cliente nuevo desde los datos de una factura.
        Usado cuando se marca "Guardar cliente" al facturar.
        """
        data = request.data
        
        # Verificar si ya existe
        numero_doc = data.get('numero_documento', '').strip()
        if numero_doc and Cliente.objects.filter(numero_documento=numero_doc).exists():
            return Response(
                {'error': 'Ya existe un cliente con ese documento'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ClienteSerializer(data=data)
        if serializer.is_valid():
            cliente = serializer.save()
            return Response({
                'mensaje': 'Cliente creado exitosamente',
                'cliente': ClienteDropdownSerializer(cliente).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# ENDPOINTS PARA DROPDOWNS (SIN PAGINACION)
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_dropdown(request):
    """
    Retorna productos con campos mínimos para dropdowns.
    Optimizado: usa .values() directo sin serializer pesado.
    """
    productos = Producto.objects.filter(activo=True).values(
        'id', 'codigo', 'nombre', 'precio_costo', 'precio_unitario', 'stock_disponible'
    ).order_by('nombre')
    return Response(list(productos))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proveedores_dropdown(request):
    """
    Retorna TODOS los proveedores para selectores.
    """
    from .models import Proveedor
    proveedores = Proveedor.objects.filter(activo=True).values(
        'id', 'nombre', 'ruc'
    ).order_by('nombre')
    
    return Response(list(proveedores))


# ==========================================
# ENDPOINT PARA CREAR PRODUCTO RÁPIDO
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def producto_rapido(request):
    """
    Crea un producto rápido con campos mínimos.
    Usado desde el modal de factura de compra cuando llega un artículo nuevo.
    - Código: opcional (se deja null si no se pone)
    - Categoría: texto libre, se busca o crea automáticamente
    - Precio venta: se calcula como precio_costo + 30%
    """
    from .models import Categoria
    from decimal import Decimal
    
    nombre = request.data.get('nombre', '').strip()
    codigo = request.data.get('codigo', '').strip() or None
    categoria_texto = request.data.get('categoria_nombre', '').strip()
    marca = request.data.get('marca', '').strip()
    descripcion = request.data.get('descripcion', '').strip()
    precio_costo = Decimal(str(request.data.get('precio_costo', 0) or 0))
    
    if not nombre:
        return Response({'error': 'El nombre del producto es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)
    if not categoria_texto:
        return Response({'error': 'La categoría es obligatoria'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar o crear la categoría por nombre
    categoria, creada = Categoria.objects.get_or_create(
        nombre__iexact=categoria_texto,
        defaults={'nombre': categoria_texto}
    )
    
    # Verificar código duplicado si se proporcionó
    if codigo and Producto.objects.filter(codigo=codigo).exists():
        return Response({'error': f'Ya existe un producto con código {codigo}'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Calcular precio de venta = costo + 30%
    precio_unitario = (precio_costo * Decimal('1.30')).quantize(Decimal('1'))
    
    producto = Producto.objects.create(
        codigo=codigo,
        nombre=nombre,
        categoria=categoria,
        marca=marca or None,
        descripcion=descripcion or None,
        precio_costo=precio_costo,
        precio_unitario=precio_unitario,
        stock_disponible=0,
        stock_minimo=0,
        activo=True
    )
    
    return Response({
        'id': producto.id,
        'codigo': producto.codigo or '',
        'nombre': producto.nombre,
        'categoria': producto.categoria.id,
        'categoria_nombre': producto.categoria.nombre,
        'categoria_creada': creada,
        'marca': producto.marca or '',
        'descripcion': producto.descripcion or '',
        'precio_costo': float(producto.precio_costo),
        'precio_unitario': float(producto.precio_unitario),
        'mensaje': f'Producto "{producto.nombre}" creado exitosamente'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def categorias_dropdown(request):
    """
    Retorna TODAS las categorías para selectores.
    """
    from .models import Categoria
    categorias = Categoria.objects.all().values('id', 'nombre').order_by('nombre')
    return Response(list(categorias))


# ==========================================
# VIEWSET PARA FACTURAS DE COMPRA
# ==========================================

from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import FacturaCompra
from .serializers import FacturaCompraListSerializer, FacturaCompraDetailSerializer


class FacturaCompraViewSet(ModelViewSet):
    """
    ViewSet para gestionar facturas de compra recibidas de proveedores.
    
    list: Obtener lista de facturas con filtros
    retrieve: Obtener detalle de una factura
    create: Crear nueva factura de compra
    update: Actualizar factura existente
    destroy: Eliminar factura (solo si no está pagada)
    """
    permission_classes = [IsAuthenticated]
    queryset = FacturaCompra.objects.all().select_related(
        'proveedor', 
        'orden_compra', 
        'usuario_registro'
    ).prefetch_related('detalles__producto')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['numero_factura', 'proveedor__nombre', 'timbrado']
    ordering_fields = ['fecha_emision', 'fecha_vencimiento', 'total', 'numero_factura']
    ordering = ['-fecha_emision', '-id']
    
    # Filtros disponibles
    filterset_fields = {
        'proveedor': ['exact'],
        'estado': ['exact'],
        'tipo_factura': ['exact'],
        'fecha_emision': ['gte', 'lte', 'exact'],
        'fecha_vencimiento': ['gte', 'lte', 'exact'],
    }
    
    def get_serializer_class(self):
        """
        Usar serializer ligero para listados y completo para detalle
        """
        if self.action == 'list':
            return FacturaCompraListSerializer
        return FacturaCompraDetailSerializer
    
    def get_queryset(self):
        """
        Permite filtrar por estado especial y próximas a vencer
        """
        queryset = super().get_queryset()
        
        # Filtro especial: facturas vencidas
        if self.request.query_params.get('vencidas') == 'true':
            from django.utils import timezone
            queryset = queryset.filter(
                estado='pendiente',
                fecha_vencimiento__lt=timezone.now().date()
            )
        
        # Filtro especial: próximas a vencer (próximos 7 días)
        if self.request.query_params.get('proximas_vencer') == 'true':
            from django.utils import timezone
            from datetime import timedelta
            hoy = timezone.now().date()
            fecha_limite = hoy + timedelta(days=7)
            queryset = queryset.filter(
                estado='pendiente',
                fecha_vencimiento__gte=hoy,
                fecha_vencimiento__lte=fecha_limite
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def marcar_pagada(self, request, pk=None):
        """
        Acción personalizada para marcar una factura como pagada
        """
        factura = self.get_object()
        
        if factura.estado == 'pagada':
            return Response(
                {'error': 'La factura ya está marcada como pagada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factura.estado = 'pagada'
        factura.save()
        
        serializer = self.get_serializer(factura)
        return Response({
            'mensaje': 'Factura marcada como pagada exitosamente',
            'factura': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Acción personalizada para cancelar una factura
        """
        factura = self.get_object()
        
        if factura.estado == 'pagada':
            return Response(
                {'error': 'No se puede cancelar una factura ya pagada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factura.estado = 'cancelada'
        factura.save()
        
        serializer = self.get_serializer(factura)
        return Response({
            'mensaje': 'Factura cancelada exitosamente',
            'factura': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Retorna estadísticas de facturas de compra
        """
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        from datetime import timedelta
        
        hoy = timezone.now().date()
        
        stats = {
            'total_facturas': self.get_queryset().count(),
            'facturas_pendientes': self.get_queryset().filter(estado='pendiente').count(),
            'facturas_pagadas': self.get_queryset().filter(estado='pagada').count(),
            'facturas_vencidas': self.get_queryset().filter(
                estado='pendiente',
                fecha_vencimiento__lt=hoy
            ).count(),
            'facturas_proximas_vencer': self.get_queryset().filter(
                estado='pendiente',
                fecha_vencimiento__gte=hoy,
                fecha_vencimiento__lte=hoy + timedelta(days=7)
            ).count(),
            'monto_total_pendiente': self.get_queryset().filter(
                estado='pendiente'
            ).aggregate(total=Sum('total'))['total'] or 0,
            'monto_total_pagado': self.get_queryset().filter(
                estado='pagada'
            ).aggregate(total=Sum('total'))['total'] or 0,
        }
        
        return Response(stats)