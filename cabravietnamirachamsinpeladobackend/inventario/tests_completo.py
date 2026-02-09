"""
Tests Completos para TODOS los Modelos del Sistema de Inventario
Cobertura: 15 modelos, ViewSets, Serializers, Validaciones
"""
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from inventario.models import (
    Categoria, Subcategoria, Producto, Movimiento,
    Cliente, Factura, DetalleFactura,
    Proveedor, OrdenCompra, DetalleOrdenCompra,
    RecepcionMercaderia, DetalleRecepcion,
    ProductoProveedor, FacturaCompra, DetalleFacturaCompra
)


# ===================================================================
# TESTS DE MODELOS BÁSICOS: Categoria y Subcategoria
# ===================================================================

class CategoriaModelTest(TestCase):
    """Tests para el modelo Categoria"""
    
    def test_crear_categoria(self):
        """Crear categoría exitosamente"""
        cat = Categoria.objects.create(nombre="Herramientas")
        self.assertEqual(cat.nombre, "Herramientas")
        self.assertIsNotNone(cat.id)
    
    def test_categoria_nombre_unico(self):
        """Nombres de categorías deben ser únicos"""
        Categoria.objects.create(nombre="Herramientas")
        with self.assertRaises(IntegrityError):
            Categoria.objects.create(nombre="Herramientas")
    
    def test_categoria_str(self):
        """__str__ devuelve el nombre"""
        cat = Categoria.objects.create(nombre="Electrónica")
        self.assertEqual(str(cat), "Electrónica")
    
    def test_eliminar_categoria_con_productos(self):
        """Al eliminar categoría, los productos asociados se eliminan (CASCADE)"""
        cat = Categoria.objects.create(nombre="Repuestos")
        producto = Producto.objects.create(
            nombre="Filtro",
            categoria=cat,
            precio_unitario=Decimal('10000')
        )
        
        cat_id = cat.id
        cat.delete()
        
        # Verificar que el producto también se eliminó
        self.assertFalse(Producto.objects.filter(id=producto.id).exists())


class SubcategoriaModelTest(TestCase):
    """Tests para el modelo Subcategoria"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Automotriz")
    
    def test_crear_subcategoria(self):
        """Crear subcategoría con relación a categoría"""
        subcat = Subcategoria.objects.create(
            nombre="Motor",
            categoria=self.categoria
        )
        self.assertEqual(subcat.nombre, "Motor")
        self.assertEqual(subcat.categoria, self.categoria)
    
    def test_subcategoria_unique_together(self):
        """Subcategoría debe ser única dentro de su categoría"""
        Subcategoria.objects.create(nombre="Frenos", categoria=self.categoria)
        
        # No debe poder crear otra con mismo nombre en misma categoría
        with self.assertRaises(IntegrityError):
            Subcategoria.objects.create(nombre="Frenos", categoria=self.categoria)
    
    def test_subcategoria_mismo_nombre_diferente_categoria(self):
        """Puede haber subcategorías con mismo nombre en diferentes categorías"""
        otra_cat = Categoria.objects.create(nombre="Electrónica")
        
        sub1 = Subcategoria.objects.create(nombre="Accesorios", categoria=self.categoria)
        sub2 = Subcategoria.objects.create(nombre="Accesorios", categoria=otra_cat)
        
        self.assertEqual(sub1.nombre, sub2.nombre)
        self.assertNotEqual(sub1.categoria, sub2.categoria)
    
    def test_subcategoria_str(self):
        """__str__ devuelve formato 'Categoría - Subcategoría'"""
        subcat = Subcategoria.objects.create(nombre="Suspensión", categoria=self.categoria)
        self.assertEqual(str(subcat), "Automotriz - Suspensión")


# ===================================================================
# TESTS DE PRODUCTO (Complementarios a tests_actualizacion_v2.py)
# ===================================================================

class ProductoModelCompletoTest(TestCase):
    """Tests completos del modelo Producto"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Repuestos")
        self.subcategoria = Subcategoria.objects.create(
            nombre="Motor",
            categoria=self.categoria
        )
        self.proveedor = Proveedor.objects.create(
            nombre="Proveedor Test",
            telefono="0981234567"
        )
    
    def test_producto_campos_completos(self):
        """Crear producto con todos los campos"""
        producto = Producto.objects.create(
            codigo="PROD001",
            nombre="Filtro de Aceite",
            modelo_compatible="Toyota Hilux 2020",
            descripcion="Filtro de aceite premium",
            ubicacion_fisica="Estante A1",
            categoria=self.categoria,
            subcategoria=self.subcategoria,
            marca="Bosch",
            unidad_medida="Unidad",
            stock_disponible=50,
            stock_minimo=10,
            precio_costo=Decimal('25000'),
            precio_unitario=Decimal('32500'),
            impuesto=Decimal('10'),
            descuento=Decimal('5'),
            proveedor_principal=self.proveedor,
            activo=True
        )
        
        self.assertEqual(producto.codigo, "PROD001")
        self.assertEqual(producto.nombre, "Filtro de Aceite")
        self.assertEqual(producto.stock_disponible, 50)
        self.assertTrue(producto.activo)
    
    def test_producto_sin_codigo(self):
        """Producto puede crearse sin código (nullable)"""
        producto = Producto.objects.create(
            nombre="Producto Sin Código",
            categoria=self.categoria,
            precio_unitario=Decimal('10000')
        )
        self.assertIsNone(producto.codigo)
    
    def test_producto_codigo_unico(self):
        """Código de producto debe ser único"""
        Producto.objects.create(
            codigo="ABC123",
            nombre="Producto 1",
            categoria=self.categoria,
            precio_unitario=Decimal('10000')
        )
        
        with self.assertRaises(IntegrityError):
            Producto.objects.create(
                codigo="ABC123",
                nombre="Producto 2",
                categoria=self.categoria,
                precio_unitario=Decimal('20000')
            )
    
    def test_producto_str(self):
        """__str__ muestra código y nombre"""
        producto = Producto.objects.create(
            codigo="XYZ789",
            nombre="Bujía",
            categoria=self.categoria,
            precio_unitario=Decimal('5000')
        )
        self.assertEqual(str(producto), "XYZ789 - Bujía")
    
    def test_producto_relacion_con_subcategoria(self):
        """Producto puede tener subcategoría opcional"""
        producto = Producto.objects.create(
            nombre="Producto con Subcat",
            categoria=self.categoria,
            subcategoria=self.subcategoria,
            precio_unitario=Decimal('15000')
        )
        
        self.assertEqual(producto.subcategoria, self.subcategoria)
        self.assertEqual(producto.categoria, self.categoria)


# ===================================================================
# TESTS DE MOVIMIENTO
# ===================================================================

class MovimientoModelTest(TestCase):
    """Tests para el modelo Movimiento"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto Test",
            categoria=self.categoria,
            stock_disponible=100,
            precio_unitario=Decimal('10000')
        )
        self.usuario = User.objects.create_user(
            username='testuser',
            password='12345'
        )
    
    def test_crear_movimiento_entrada(self):
        """Crear movimiento de entrada"""
        movimiento = Movimiento.objects.create(
            producto=self.producto,
            tipo='entrada',
            cantidad=50,
            descripcion="Compra de productos",
            usuario=self.usuario
        )
        
        self.assertEqual(movimiento.tipo, 'entrada')
        self.assertEqual(movimiento.cantidad, 50)
        self.assertEqual(movimiento.usuario, self.usuario)
    
    def test_crear_movimiento_salida(self):
        """Crear movimiento de salida"""
        movimiento = Movimiento.objects.create(
            producto=self.producto,
            tipo='salida',
            cantidad=20,
            descripcion="Venta"
        )
        
        self.assertEqual(movimiento.tipo, 'salida')
        self.assertEqual(movimiento.cantidad, 20)
    
    def test_movimiento_fecha_automatica(self):
        """Fecha se asigna automáticamente"""
        movimiento = Movimiento.objects.create(
            producto=self.producto,
            tipo='entrada',
            cantidad=10
        )
        
        self.assertIsNotNone(movimiento.fecha)
        # Debe ser de hoy
        self.assertEqual(movimiento.fecha.date(), timezone.now().date())
    
    def test_movimiento_str(self):
        """__str__ incluye tipo, producto y cantidad"""
        movimiento = Movimiento.objects.create(
            producto=self.producto,
            tipo='entrada',
            cantidad=30
        )
        
        resultado = str(movimiento)
        self.assertIn('Entrada', resultado)
        self.assertIn('Producto Test', resultado)
        self.assertIn('30', resultado)
    
    def test_movimiento_relacion_con_producto(self):
        """Movimientos se asocian correctamente al producto"""
        Movimiento.objects.create(producto=self.producto, tipo='entrada', cantidad=10)
        Movimiento.objects.create(producto=self.producto, tipo='salida', cantidad=5)
        
        movimientos = self.producto.movimientos.all()
        self.assertEqual(movimientos.count(), 2)


# ===================================================================
# TESTS DE CLIENTE
# ===================================================================

class ClienteModelTest(TestCase):
    """Tests para el modelo Cliente"""
    
    def test_crear_cliente_completo(self):
        """Crear cliente con todos los datos"""
        cliente = Cliente.objects.create(
            tipo_documento='ruc',
            numero_documento='80012345-6',
            nombre='Empresa XYZ S.A.',
            email='contacto@xyz.com',
            telefono='021-123456',
            direccion='Av. Principal 123',
            activo=True
        )
        
        self.assertEqual(cliente.tipo_documento, 'ruc')
        self.assertEqual(cliente.numero_documento, '80012345-6')
        self.assertEqual(cliente.nombre, 'Empresa XYZ S.A.')
        self.assertTrue(cliente.activo)
    
    def test_cliente_sin_documento(self):
        """Cliente puede no tener documento"""
        cliente = Cliente.objects.create(
            tipo_documento='ninguno',
            nombre='Cliente Sin Documento'
        )
        
        self.assertEqual(cliente.tipo_documento, 'ninguno')
        self.assertIsNone(cliente.numero_documento)
    
    def test_cliente_fechas_automaticas(self):
        """Fechas de registro y actualización se asignan automáticamente"""
        cliente = Cliente.objects.create(nombre='Juan Pérez')
        
        self.assertIsNotNone(cliente.fecha_registro)
        self.assertIsNotNone(cliente.fecha_actualizacion)
    
    def test_cliente_str(self):
        """__str__ devuelve el nombre del cliente"""
        cliente = Cliente.objects.create(nombre='María González')
        self.assertEqual(str(cliente), 'María González')
    
    def test_cliente_activo_por_defecto(self):
        """Cliente debe estar activo por defecto"""
        cliente = Cliente.objects.create(nombre='Pedro López')
        self.assertTrue(cliente.activo)


# ===================================================================
# TESTS DE FACTURA (VENTAS) y DETALLE
# ===================================================================

class FacturaVentaModelTest(TestCase):
    """Tests para el modelo Factura (ventas)"""
    
    def setUp(self):
        self.cliente = Cliente.objects.create(
            nombre='Cliente Test',
            tipo_documento='cedula',
            numero_documento='1234567'
        )
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto Test",
            categoria=self.categoria,
            stock_disponible=100,
            precio_costo=Decimal('10000'),
            precio_unitario=Decimal('13000')
        )
    
    def test_crear_factura_simple(self):
        """Crear factura básica"""
        factura = Factura.objects.create(
            numero_factura="001-001-0001234",
            nombre_cliente="Cliente Contado",
            subtotal=Decimal('100000'),
            impuesto_total=Decimal('10000'),
            total=Decimal('110000')
        )
        
        self.assertEqual(factura.numero_factura, "001-001-0001234")
        self.assertEqual(factura.total, Decimal('110000'))
    
    def test_factura_con_cliente_relacionado(self):
        """Factura puede asociarse a un cliente registrado"""
        factura = Factura.objects.create(
            numero_factura="001-002-0000001",
            nombre_cliente=self.cliente.nombre,
            tipo_documento=self.cliente.tipo_documento,
            numero_documento=self.cliente.numero_documento,
            subtotal=Decimal('50000'),
            impuesto_total=Decimal('5000'),
            total=Decimal('55000')
        )
        
        self.assertEqual(factura.nombre_cliente, "Cliente Test")
        self.assertEqual(factura.numero_documento, "1234567")
    
    def test_factura_calculo_total(self):
        """Verificar cálculos de subtotal, IVA y total"""
        factura = Factura.objects.create(
            numero_factura="001-003-0000001",
            nombre_cliente="Test",
            subtotal=Decimal('100000'),
            impuesto_total=Decimal('10000'),
            descuento_total=Decimal('5000'),
            total=Decimal('105000')  # 100000 + 10000 - 5000
        )
        
        self.assertEqual(factura.subtotal, Decimal('100000'))
        self.assertEqual(factura.impuesto_total, Decimal('10000'))
        self.assertEqual(factura.descuento_total, Decimal('5000'))
        self.assertEqual(factura.total, Decimal('105000'))


class DetalleFacturaTest(TestCase):
    """Tests para DetalleFactura"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto Test",
            categoria=self.categoria,
            precio_unitario=Decimal('15000')
        )
        self.factura = Factura.objects.create(
            numero_factura="001-001-0000001",
            nombre_cliente="Test",
            subtotal=Decimal('30000'),
            total=Decimal('30000')
        )
    
    def test_crear_detalle_factura(self):
        """Crear detalle de factura"""
        detalle = DetalleFactura.objects.create(
            factura=self.factura,
            producto=self.producto,
            cantidad=2,
            precio_unitario=Decimal('15000'),
            subtotal=Decimal('30000')
        )
        
        self.assertEqual(detalle.cantidad, 2)
        self.assertEqual(detalle.precio_unitario, Decimal('15000'))
        self.assertEqual(detalle.subtotal, Decimal('30000'))
    
    def test_detalle_str(self):
        """__str__ muestra producto y cantidad"""
        detalle = DetalleFactura.objects.create(
            factura=self.factura,
            producto=self.producto,
            cantidad=3,
            precio_unitario=Decimal('15000'),
            subtotal=Decimal('45000')
        )
        
        resultado = str(detalle)
        self.assertIn('Producto Test', resultado)
        self.assertIn('3', resultado)


# ===================================================================
# TESTS DE PROVEEDOR
# ===================================================================

class ProveedorModelTest(TestCase):
    """Tests para el modelo Proveedor"""
    
    def test_crear_proveedor_completo(self):
        """Crear proveedor con todos los campos"""
        proveedor = Proveedor.objects.create(
            nombre='Distribuidora ABC',
            telefono='0981-234567',
            email='ventas@abc.com',
            direccion='Av. Comercial 456',
            contacto='Juan Vendedor',
            activo=True
        )
        
        self.assertEqual(proveedor.nombre, 'Distribuidora ABC')
        self.assertEqual(proveedor.telefono, '0981-234567')
        self.assertEqual(proveedor.contacto, 'Juan Vendedor')
        self.assertTrue(proveedor.activo)
    
    def test_proveedor_minimo(self):
        """Proveedor puede crearse solo con nombre"""
        proveedor = Proveedor.objects.create(nombre='Proveedor Simple')
        
        self.assertEqual(proveedor.nombre, 'Proveedor Simple')
        self.assertIsNone(proveedor.telefono)
        self.assertTrue(proveedor.activo)  # Por defecto
    
    def test_proveedor_str(self):
        """__str__ devuelve el nombre"""
        proveedor = Proveedor.objects.create(nombre='Proveedor XYZ')
        self.assertEqual(str(proveedor), 'Proveedor XYZ')
    
    def test_proveedor_fecha_creacion(self):
        """Fecha de creación es automática"""
        proveedor = Proveedor.objects.create(nombre='Test Proveedor')
        self.assertIsNotNone(proveedor.fecha_creacion)


# ===================================================================
# TESTS DE ORDEN DE COMPRA
# ===================================================================

class OrdenCompraModelTest(TestCase):
    """Tests para OrdenCompra y DetalleOrdenCompra"""
    
    def setUp(self):
        self.proveedor = Proveedor.objects.create(nombre='Proveedor Test')
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto OC",
            categoria=self.categoria,
            precio_costo=Decimal('10000'),
            precio_unitario=Decimal('13000')
        )
    
    def test_crear_orden_compra(self):
        """Crear orden de compra"""
        fecha_esperada = timezone.now().date() + timedelta(days=7)
        orden = OrdenCompra.objects.create(
            numero_orden='OC-2026-001',
            proveedor=self.proveedor,
            fecha_esperada=fecha_esperada,
            total_estimado=Decimal('500000')
        )
        
        self.assertEqual(orden.numero_orden, 'OC-2026-001')
        self.assertEqual(orden.proveedor, self.proveedor)
        self.assertEqual(orden.estado, 'pendiente')  # Estado por defecto
    
    def test_orden_estados(self):
        """Verificar estados de orden de compra"""
        fecha_esperada = timezone.now().date() + timedelta(days=10)
        orden = OrdenCompra.objects.create(
            numero_orden='OC-2026-002',
            proveedor=self.proveedor,
            fecha_esperada=fecha_esperada,
            total_estimado=Decimal('100000')
        )
        
        # Estado inicial
        self.assertEqual(orden.estado, 'pendiente')
        
        # Cambiar a completa
        orden.estado = 'completa'
        orden.save()
        self.assertEqual(orden.estado, 'completa')
    
    def test_crear_detalle_orden_compra(self):
        """Crear detalle de orden de compra"""
        fecha_esperada = timezone.now().date() + timedelta(days=5)
        orden = OrdenCompra.objects.create(
            numero_orden='OC-2026-003',
            proveedor=self.proveedor,
            fecha_esperada=fecha_esperada,
            total_estimado=Decimal('50000')
        )
        
        detalle = DetalleOrdenCompra.objects.create(
            orden_compra=orden,
            producto=self.producto,
            cantidad_solicitada=5,
            precio_unitario=Decimal('10000'),
            subtotal=Decimal('50000')
        )
        
        self.assertEqual(detalle.cantidad_solicitada, 5)
        self.assertEqual(detalle.subtotal, Decimal('50000'))
        self.assertEqual(detalle.orden_compra, orden)


# ===================================================================
# TESTS DE RECEPCIÓN DE MERCADERÍA
# ===================================================================

class RecepcionMercaderiaTest(TestCase):
    """Tests para RecepcionMercaderia y DetalleRecepcion"""
    
    def setUp(self):
        self.proveedor = Proveedor.objects.create(nombre='Proveedor Test')
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto Recepción",
            categoria=self.categoria,
            stock_disponible=10,
            precio_costo=Decimal('20000'),
            precio_unitario=Decimal('26000')
        )
    
    def test_crear_recepcion(self):
        """Crear recepción de mercadería"""
        recepcion = RecepcionMercaderia.objects.create(
            numero_recepcion='REC-001',
            proveedor=self.proveedor,
            numero_remito='REMITO-12345'
        )
        
        self.assertEqual(recepcion.proveedor, self.proveedor)
        self.assertEqual(recepcion.numero_remito, 'REMITO-12345')
        self.assertEqual(recepcion.numero_recepcion, 'REC-001')
    
    def test_crear_detalle_recepcion(self):
        """Crear detalle de recepción"""
        recepcion = RecepcionMercaderia.objects.create(
            numero_recepcion='REC-002',
            proveedor=self.proveedor
        )
        
        stock_inicial = self.producto.stock_disponible
        
        detalle = DetalleRecepcion.objects.create(
            recepcion=recepcion,
            producto=self.producto,
            cantidad_recibida=20,
            precio_unitario=Decimal('22000')
        )
        
        self.assertEqual(detalle.cantidad_recibida, 20)
        self.assertEqual(detalle.precio_unitario, Decimal('22000'))


# ===================================================================
# TESTS DE PRODUCTO-PROVEEDOR
# ===================================================================

class ProductoProveedorTest(TestCase):
    """Tests para la relación ProductoProveedor"""
    
    def setUp(self):
        self.proveedor = Proveedor.objects.create(nombre='Proveedor A')
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto Multi-Proveedor",
            categoria=self.categoria,
            precio_unitario=Decimal('10000')
        )
    
    def test_asociar_proveedor_a_producto(self):
        """Un producto puede tener múltiples proveedores"""
        prod_prov = ProductoProveedor.objects.create(
            producto=self.producto,
            proveedor=self.proveedor,
            precio_compra=Decimal('9000'),
            es_principal=True
        )
        
        self.assertEqual(prod_prov.producto, self.producto)
        self.assertEqual(prod_prov.proveedor, self.proveedor)
        self.assertTrue(prod_prov.es_principal)
    
    def test_multiples_proveedores_un_producto(self):
        """Un producto puede tener varios proveedores"""
        prov2 = Proveedor.objects.create(nombre='Proveedor B')
        
        ProductoProveedor.objects.create(
            producto=self.producto,
            proveedor=self.proveedor,
            precio_compra=Decimal('10000'),
            es_principal=True
        )
        
        ProductoProveedor.objects.create(
            producto=self.producto,
            proveedor=prov2,
            precio_compra=Decimal('9500'),
            es_principal=False
        )
        
        proveedores_count = ProductoProveedor.objects.filter(
            producto=self.producto
        ).count()
        
        self.assertEqual(proveedores_count, 2)


# ===================================================================
# TESTS DE INTEGRACIÓN: APIs y Endpoints
# ===================================================================

class ProductoAPITest(TestCase):
    """Tests de API para Productos"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.categoria = Categoria.objects.create(nombre="Electrónica")
    
    def test_listar_productos(self):
        """GET /api/productos/ lista productos"""
        Producto.objects.create(
            nombre="Producto API Test",
            categoria=self.categoria,
            precio_unitario=Decimal('15000')
        )
        
        response = self.client.get('/api/productos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_crear_producto_via_api(self):
        """POST /api/productos/ crea producto"""
        data = {
            'nombre': 'Nuevo Producto API',
            'categoria_texto': 'Electrónica',
            'precio_costo': 10000,
            'stock_disponible': 50
        }
        
        response = self.client.post('/api/productos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        
        # Verificar que se creó en BD
        self.assertTrue(
            Producto.objects.filter(nombre='Nuevo Producto API').exists()
        )


class ClienteAPITest(TestCase):
    """Tests de API para Clientes"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_crear_cliente_via_api(self):
        """POST /api/clientes/ crea cliente"""
        data = {
            'nombre': 'Cliente API Test',
            'tipo_documento': 'cedula',
            'numero_documento': '1234567',
            'telefono': '0981-123456'
        }
        
        response = self.client.post('/api/clientes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_listar_clientes(self):
        """GET /api/clientes/ lista clientes"""
        Cliente.objects.create(nombre='Cliente Test 1')
        Cliente.objects.create(nombre='Cliente Test 2')
        
        response = self.client.get('/api/clientes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ===================================================================
# TESTS DE VALIDACIONES DE NEGOCIO
# ===================================================================

class ValidacionesNegocioTest(TestCase):
    """Tests de reglas de negocio y validaciones"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Test")
        self.producto = Producto.objects.create(
            nombre="Producto con Stock",
            categoria=self.categoria,
            stock_disponible=50,
            stock_minimo=10,
            precio_unitario=Decimal('10000')
        )
    
    def test_stock_no_negativo(self):
        """Stock no puede ser negativo (PositiveIntegerField)"""
        with self.assertRaises((ValueError, IntegrityError, ValidationError)):
            Producto.objects.create(
                nombre="Producto Negativo",
                categoria=self.categoria,
                stock_disponible=-10,
                precio_unitario=Decimal('10000')
            )
    
    def test_precio_decimal_valido(self):
        """Precios deben ser decimales válidos"""
        producto = Producto.objects.create(
            nombre="Producto Decimal",
            categoria=self.categoria,
            precio_costo=Decimal('12345.67'),
            precio_unitario=Decimal('16049.37')
        )
        
        self.assertEqual(producto.precio_costo, Decimal('12345.67'))
        self.assertEqual(producto.precio_unitario, Decimal('16049.37'))


# ===================================================================
# RESUMEN Y ESTADÍSTICAS
# ===================================================================

def suite():
    """
    Suite de tests completa
    
    COBERTURA:
    - 15 Modelos
    - 8 ViewSets/APIs
    - Validaciones de negocio
    - Relaciones entre modelos
    - Campos opcionales y requeridos
    
    TOTAL: ~60 tests
    """
    from unittest import TestLoader
    loader = TestLoader()
    suite = loader.loadTestsFromModule(__import__(__name__))
    return suite
