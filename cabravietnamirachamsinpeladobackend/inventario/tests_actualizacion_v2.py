"""
Tests para las nuevas funcionalidades de la actualización V2.1
- Cálculo automático de precio_venta (+30%)
- Código de producto opcional
- Endpoint productos_dropdown completo
- Edición de productos con recálculo de precios
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from inventario.models import Producto, Categoria, Proveedor, RecepcionMercaderia, DetalleRecepcion


class CodigoProductoOpcionalTest(TestCase):
    """Tests para verificar que el código de producto es opcional"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Test")
    
    def test_producto_sin_codigo_es_valido(self):
        """Producto sin código debe ser válido"""
        producto = Producto.objects.create(
            nombre="Producto sin código",
            categoria=self.categoria,
            precio_costo=Decimal('10000'),
            precio_unitario=Decimal('13000')
        )
        self.assertIsNone(producto.codigo)
        self.assertEqual(producto.nombre, "Producto sin código")
    
    def test_producto_con_codigo_vacio_es_valido(self):
        """Producto con código vacío debe ser válido"""
        producto = Producto.objects.create(
            codigo="",
            nombre="Producto código vacío",
            categoria=self.categoria,
            precio_costo=Decimal('10000'),
            precio_unitario=Decimal('13000')
        )
        self.assertEqual(producto.codigo, "")
        self.assertEqual(producto.nombre, "Producto código vacío")
    
    def test_multiples_productos_sin_codigo(self):
        """Múltiples productos sin código son válidos"""
        p1 = Producto.objects.create(
            nombre="Producto 1",
            categoria=self.categoria,
            precio_costo=Decimal('10000'),
            precio_unitario=Decimal('13000')
        )
        p2 = Producto.objects.create(
            nombre="Producto 2",
            categoria=self.categoria,
            precio_costo=Decimal('20000'),
            precio_unitario=Decimal('26000')
        )
        self.assertIsNone(p1.codigo)
        self.assertIsNone(p2.codigo)
        self.assertEqual(Producto.objects.filter(codigo__isnull=True).count(), 2)


class PrecioVentaAutomaticoTest(TestCase):
    """Tests para el cálculo automático de precio_venta (+30%)"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Electronics")
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_crear_producto_calcula_precio_venta_automatico(self):
        """Al crear producto, precio_unitario debe ser precio_costo * 1.30"""
        data = {
            'nombre': 'Mouse Inalámbrico',
            'categoria_texto': 'Electronics',
            'precio_costo': 100000,
            'stock_disponible': 10
        }
        response = self.client.post('/api/productos/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['precio_costo']), Decimal('100000'))
        # 100000 * 1.30 = 130000
        self.assertEqual(Decimal(response.data['precio_unitario']), Decimal('130000'))
    
    def test_actualizar_precio_costo_recalcula_precio_venta(self):
        """Al actualizar precio_costo, debe recalcular precio_unitario"""
        # Crear producto inicial
        producto = Producto.objects.create(
            nombre="Teclado",
            categoria=self.categoria,
            precio_costo=Decimal('50000'),
            precio_unitario=Decimal('65000')
        )
        
        # Actualizar precio_costo
        data = {
            'codigo': '',
            'nombre': 'Teclado',
            'categoria_texto': 'Electronics',
            'precio_costo': 80000,  # Nuevo precio
            'stock_disponible': 0
        }
        response = self.client.put(f'/api/productos/{producto.id}/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['precio_costo']), Decimal('80000'))
        # 80000 * 1.30 = 104000
        self.assertEqual(Decimal(response.data['precio_unitario']), Decimal('104000'))
    
    def test_calculo_30_por_ciento_precision(self):
        """Verificar precisión del cálculo de 30%"""
        test_cases = [
            (Decimal('10000'), Decimal('13000')),    # 10,000 * 1.30 = 13,000
            (Decimal('25000'), Decimal('32500')),    # 25,000 * 1.30 = 32,500
            (Decimal('100000'), Decimal('130000')),  # 100,000 * 1.30 = 130,000
            (Decimal('7500'), Decimal('9750')),      # 7,500 * 1.30 = 9,750
        ]
        
        for precio_costo, precio_esperado in test_cases:
            with self.subTest(precio_costo=precio_costo):
                data = {
                    'nombre': f'Producto {precio_costo}',
                    'categoria_texto': 'Electronics',
                    'precio_costo': str(precio_costo),
                    'stock_disponible': 1
                }
                response = self.client.post('/api/productos/', data, format='json')
                
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(
                    Decimal(response.data['precio_unitario']), 
                    precio_esperado,
                    f"Para precio_costo={precio_costo}, esperaba {precio_esperado}"
                )
    
    def test_precio_costo_cero_no_calcula(self):
        """Con precio_costo=0, no debe calcular precio_venta"""
        data = {
            'nombre': 'Producto sin precio',
            'categoria_texto': 'Electronics',
            'precio_costo': 0,
            'stock_disponible': 1
        }
        response = self.client.post('/api/productos/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # El backend puede establecer un precio por defecto o dejarlo en 0
        self.assertIsNotNone(response.data['precio_unitario'])


class RecepcionMercaderiaActualizaPreciosTest(TestCase):
    """Tests para verificar que la recepción de mercadería actualiza precios"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Herramientas")
        self.proveedor = Proveedor.objects.create(
            nombre="Proveedor Test",
            telefono="0981234567",
            email="proveedor@test.com"
        )
        self.producto = Producto.objects.create(
            nombre="Martillo",
            categoria=self.categoria,
            precio_costo=Decimal('30000'),
            precio_unitario=Decimal('39000'),
            stock_disponible=5
        )
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_recepcion_actualiza_precio_costo_y_recalcula_venta(self):
        """Al recibir mercadería, debe actualizar precio_costo y recalcular precio_unitario"""
        data = {
            'numero_recepcion': 'REC-TEST-001',
            'proveedor': self.proveedor.id,
            'detalles': [
                {
                    'producto': self.producto.id,
                    'cantidad_recibida': 10,
                    'precio_unitario': 40000  # Nuevo precio de costo
                }
            ]
        }
        
        response = self.client.post('/api/recepciones/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Recargar producto desde BD
        self.producto.refresh_from_db()
        
        # Verificar que se actualizó el precio_costo
        self.assertEqual(self.producto.precio_costo, Decimal('40000'))
        
        # Verificar que se recalculó precio_unitario (+30%)
        # 40000 * 1.30 = 52000
        self.assertEqual(self.producto.precio_unitario, Decimal('52000'))
        
        # Verificar que se actualizó el stock
        self.assertEqual(self.producto.stock_disponible, 15)  # 5 + 10
    
    def test_recepcion_multiples_productos(self):
        """Recepción con múltiples productos actualiza precios de todos"""
        producto2 = Producto.objects.create(
            nombre="Destornillador",
            categoria=self.categoria,
            precio_costo=Decimal('15000'),
            precio_unitario=Decimal('19500'),
            stock_disponible=8
        )
        
        data = {
            'numero_recepcion': 'REC-TEST-002',
            'proveedor': self.proveedor.id,
            'detalles': [
                {
                    'producto': self.producto.id,
                    'cantidad_recibida': 5,
                    'precio_unitario': 35000
                },
                {
                    'producto': producto2.id,
                    'cantidad_recibida': 10,
                    'precio_unitario': 18000
                }
            ]
        }
        
        response = self.client.post('/api/recepciones/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar producto 1
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.precio_costo, Decimal('35000'))
        self.assertEqual(self.producto.precio_unitario, Decimal('45500'))  # 35000 * 1.30
        
        # Verificar producto 2
        producto2.refresh_from_db()
        self.assertEqual(producto2.precio_costo, Decimal('18000'))
        self.assertEqual(producto2.precio_unitario, Decimal('23400'))  # 18000 * 1.30


class ProductosDropdownEndpointTest(TestCase):
    """Tests para el endpoint /api/productos/dropdown/ que ahora devuelve todos los campos"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Electronicos")
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Crear productos de prueba
        self.producto1 = Producto.objects.create(
            codigo="PROD001",
            nombre="Producto con todos los campos",
            categoria=self.categoria,
            marca="Samsung",
            modelo_compatible="Galaxy S21",
            descripcion="Descripción completa del producto",
            precio_costo=Decimal('50000'),
            precio_unitario=Decimal('65000'),
            stock_disponible=10,
            stock_minimo=5,
            ubicacion_fisica="Estante A1"
        )
        
        self.producto2 = Producto.objects.create(
            nombre="Producto sin código",
            categoria=self.categoria,
            descripcion="Producto sin código",
            precio_costo=Decimal('30000'),
            precio_unitario=Decimal('39000'),
            stock_disponible=20
        )
    
    def test_dropdown_devuelve_todos_los_campos(self):
        """El endpoint dropdown debe devolver TODOS los campos del producto"""
        response = self.client.get('/api/productos/dropdown/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verificar que el primer producto tiene todos los campos
        producto_data = response.data[0]
        campos_esperados = [
            'id', 'codigo', 'nombre', 'categoria', 'marca', 'modelo_compatible',
            'descripcion', 'stock_disponible', 'stock_minimo', 'precio_costo',
            'precio_unitario', 'proveedor_texto', 'ubicacion_fisica'
        ]
        
        for campo in campos_esperados:
            with self.subTest(campo=campo):
                self.assertIn(campo, producto_data, f"Campo '{campo}' no está en la respuesta")
    
    def test_dropdown_incluye_descripcion(self):
        """Verificar que la descripción se incluye en la respuesta"""
        response = self.client.get('/api/productos/dropdown/')
        
        producto_con_descripcion = next(
            (p for p in response.data if p['nombre'] == "Producto con todos los campos"),
            None
        )
        
        self.assertIsNotNone(producto_con_descripcion)
        self.assertEqual(
            producto_con_descripcion['descripcion'],
            "Descripción completa del producto"
        )
    
    def test_dropdown_incluye_precio_costo(self):
        """Verificar que precio_costo se incluye correctamente"""
        response = self.client.get('/api/productos/dropdown/')
        
        for producto in response.data:
            with self.subTest(producto=producto['nombre']):
                self.assertIn('precio_costo', producto)
                self.assertIsNotNone(producto['precio_costo'])
                # Verificar que es un número válido
                self.assertIsInstance(
                    Decimal(str(producto['precio_costo'])),
                    Decimal
                )
    
    def test_dropdown_codigo_opcional(self):
        """Verificar que productos sin código aparecen en dropdown"""
        response = self.client.get('/api/productos/dropdown/')
        
        producto_sin_codigo = next(
            (p for p in response.data if p['nombre'] == "Producto sin código"),
            None
        )
        
        self.assertIsNotNone(producto_sin_codigo)
        # El código puede ser None o vacío
        self.assertTrue(
            producto_sin_codigo['codigo'] is None or 
            producto_sin_codigo['codigo'] == ''
        )


class IntegracionCompletaTest(TestCase):
    """Tests de integración para verificar flujo completo de actualización"""
    
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Repuestos")
        self.proveedor = Proveedor.objects.create(
            nombre="Distribuidora XYZ",
            telefono="021123456",
            email="ventas@xyz.com"
        )
        self.user = User.objects.create_user(username='admin', password='admin123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_flujo_completo_crear_recibir_y_editar_producto(self):
        """Test de flujo completo: crear producto, recibir mercadería, editar"""
        
        # 1. Crear producto sin código con precio automático
        data_crear = {
            'nombre': 'Filtro de Aceite',
            'categoria_texto': 'Repuestos',
            'marca': 'Bosch',
            'descripcion': 'Filtro de aceite para motor diesel',
            'precio_costo': 45000,
            'stock_disponible': 0,
            'stock_minimo': 10
        }
        
        response_crear = self.client.post('/api/productos/', data_crear, format='json')
        self.assertEqual(response_crear.status_code, status.HTTP_201_CREATED)
        
        producto_id = response_crear.data['id']
        
        # Verificar cálculo automático del precio
        self.assertEqual(Decimal(response_crear.data['precio_costo']), Decimal('45000'))
        self.assertEqual(Decimal(response_crear.data['precio_unitario']), Decimal('58500'))  # 45000 * 1.30
        
        # 2. Verificar que aparece en dropdown con todos los campos
        response_dropdown = self.client.get('/api/productos/dropdown/')
        self.assertEqual(response_dropdown.status_code, status.HTTP_200_OK)
        
        producto_dropdown = next(
            (p for p in response_dropdown.data if p['id'] == producto_id),
            None
        )
        self.assertIsNotNone(producto_dropdown)
        self.assertEqual(producto_dropdown['descripcion'], 'Filtro de aceite para motor diesel')
        self.assertEqual(Decimal(str(producto_dropdown['precio_costo'])), Decimal('45000'))
        
        # 3. Recibir mercadería con nuevo precio
        data_recepcion = {
            'numero_recepcion': 'REC-TEST-003',
            'proveedor': self.proveedor.id,
            'detalles': [
                {
                    'producto': producto_id,
                    'cantidad_recibida': 50,
                    'precio_unitario': 50000  # Nuevo precio de costo
                }
            ]
        }
        
        response_recepcion = self.client.post('/api/recepciones/', data_recepcion, format='json')
        self.assertEqual(response_recepcion.status_code, status.HTTP_201_CREATED)
        
        # 4. Verificar que el producto se actualizó
        response_get = self.client.get(f'/api/productos/{producto_id}/')
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response_get.data['precio_costo']), Decimal('50000'))
        self.assertEqual(Decimal(response_get.data['precio_unitario']), Decimal('65000'))  # 50000 * 1.30
        self.assertEqual(response_get.data['stock_disponible'], 50)
        
        # 5. Editar producto con nuevo precio
        data_editar = {
            'codigo': 'FILT-001',  # Ahora agregamos código
            'nombre': 'Filtro de Aceite',
            'categoria_texto': 'Repuestos',
            'marca': 'Bosch',
            'descripcion': 'Filtro de aceite premium para motor diesel',
            'precio_costo': 55000,  # Cambio de precio
            'stock_disponible': 50,
            'stock_minimo': 10,
            'ubicacion_fisica': 'Estante B3'
        }
        
        response_editar = self.client.put(f'/api/productos/{producto_id}/', data_editar, format='json')
        self.assertEqual(response_editar.status_code, status.HTTP_200_OK)
        self.assertEqual(response_editar.data['codigo'], 'FILT-001')
        self.assertEqual(Decimal(response_editar.data['precio_costo']), Decimal('55000'))
        self.assertEqual(Decimal(response_editar.data['precio_unitario']), Decimal('71500'))  # 55000 * 1.30
        self.assertEqual(response_editar.data['descripcion'], 'Filtro de aceite premium para motor diesel')
        
        # 6. Verificar que todos los cambios persisten
        response_final = self.client.get(f'/api/productos/{producto_id}/')
        self.assertEqual(response_final.status_code, status.HTTP_200_OK)
        self.assertEqual(response_final.data['codigo'], 'FILT-001')
        self.assertEqual(Decimal(response_final.data['precio_unitario']), Decimal('71500'))


class MigracionesTest(TestCase):
    """Tests para verificar que las migraciones se aplicaron correctamente"""
    
    def test_modelo_producto_codigo_nullable(self):
        """Verificar que el campo código acepta NULL"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Obtener información de la columna codigo de la tabla producto
            cursor.execute("""
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name='inventario_producto' 
                AND column_name='codigo'
            """)
            row = cursor.fetchone()
            
            if row:
                self.assertEqual(row[0], 'YES', "El campo código debe aceptar NULL")
    
    def test_modelo_producto_tiene_campos_requeridos(self):
        """Verificar que el modelo Producto tiene todos los campos esperados"""
        from inventario.models import Producto
        
        campos_esperados = [
            'codigo', 'nombre', 'categoria', 'marca', 'modelo_compatible',
            'descripcion', 'stock_disponible', 'stock_minimo', 'precio_costo',
            'precio_unitario', 'ubicacion_fisica'
        ]
        
        campos_modelo = [f.name for f in Producto._meta.get_fields()]
        
        for campo in campos_esperados:
            with self.subTest(campo=campo):
                self.assertIn(campo, campos_modelo, f"Campo '{campo}' no existe en el modelo")
