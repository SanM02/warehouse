"""
Tests unitarios para el módulo de Facturas de Compra
"""
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from .models import (
    FacturaCompra, 
    DetalleFacturaCompra, 
    Proveedor, 
    Producto, 
    Categoria,
    OrdenCompra
)


class ProveedorModelTest(TestCase):
    """Tests para el modelo Proveedor"""
    
    def setUp(self):
        self.proveedor = Proveedor.objects.create(
            nombre="Proveedor Test",
            telefono="0981123456",
            email="proveedor@test.com",
            direccion="Calle Test 123",
            contacto="Juan Pérez"
        )
    
    def test_proveedor_creacion(self):
        """Verifica que el proveedor se crea correctamente"""
        self.assertEqual(self.proveedor.nombre, "Proveedor Test")
        self.assertTrue(self.proveedor.activo)
        self.assertIsNotNone(self.proveedor.fecha_creacion)
    
    def test_proveedor_str(self):
        """Verifica la representación en string"""
        self.assertEqual(str(self.proveedor), "Proveedor Test")


class FacturaCompraModelTest(TestCase):
    """Tests para el modelo FacturaCompra"""
    
    def setUp(self):
        # Crear usuario
        self.usuario = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Crear proveedor
        self.proveedor = Proveedor.objects.create(
            nombre="Distribuidora ABC",
            telefono="0981123456"
        )
        
        # Crear factura de compra
        self.factura = FacturaCompra.objects.create(
            numero_factura="001-001-0001234",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=30),
            tipo_factura='credito',
            estado='pendiente',
            subtotal=Decimal('1000000.00'),
            descuento=Decimal('50000.00'),
            impuestos=Decimal('95000.00'),
            timbrado="12345678",
            condicion_pago="30 días",
            usuario_registro=self.usuario
        )
    
    def test_factura_compra_creacion(self):
        """Verifica que la factura se crea correctamente"""
        self.assertEqual(self.factura.numero_factura, "001-001-0001234")
        self.assertEqual(self.factura.proveedor, self.proveedor)
        self.assertEqual(self.factura.estado, 'pendiente')
        self.assertEqual(self.factura.tipo_factura, 'credito')
    
    def test_calculo_total_automatico(self):
        """Verifica que el total se calcula automáticamente"""
        # Total = Subtotal - Descuento + Impuestos
        # 1000000 - 50000 + 95000 = 1045000
        expected_total = Decimal('1045000.00')
        self.assertEqual(self.factura.total, expected_total)
    
    def test_factura_str(self):
        """Verifica la representación en string"""
        expected = f"FC 001-001-0001234 - Distribuidora ABC - ₲1,045,000"
        self.assertEqual(str(self.factura), expected)
    
    def test_esta_vencida_false(self):
        """Verifica que una factura con fecha futura no está vencida"""
        self.assertFalse(self.factura.esta_vencida)
    
    def test_esta_vencida_true(self):
        """Verifica que una factura con fecha pasada está vencida"""
        self.factura.fecha_vencimiento = date.today() - timedelta(days=5)
        self.factura.save()
        self.assertTrue(self.factura.esta_vencida)
    
    def test_factura_pagada_no_esta_vencida(self):
        """Verifica que una factura pagada no se considera vencida"""
        self.factura.estado = 'pagada'
        self.factura.fecha_vencimiento = date.today() - timedelta(days=5)
        self.factura.save()
        self.assertFalse(self.factura.esta_vencida)
    
    def test_dias_para_vencimiento(self):
        """Verifica el cálculo de días para vencimiento"""
        dias = self.factura.dias_para_vencimiento
        self.assertIsNotNone(dias)
        self.assertEqual(dias, 30)
    
    def test_dias_para_vencimiento_vencida(self):
        """Verifica días negativos cuando está vencida"""
        self.factura.fecha_vencimiento = date.today() - timedelta(days=5)
        self.factura.save()
        self.assertEqual(self.factura.dias_para_vencimiento, -5)
    
    def test_factura_sin_fecha_vencimiento(self):
        """Verifica comportamiento cuando no tiene fecha de vencimiento"""
        factura_contado = FacturaCompra.objects.create(
            numero_factura="001-001-0001235",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            tipo_factura='contado',
            estado='pagada',
            subtotal=Decimal('500000.00'),
            descuento=Decimal('0.00'),
            impuestos=Decimal('50000.00')
        )
        self.assertIsNone(factura_contado.dias_para_vencimiento)
        self.assertFalse(factura_contado.esta_vencida)
    
    def test_relacion_con_orden_compra(self):
        """Verifica la relación opcional con orden de compra"""
        orden = OrdenCompra.objects.create(
            numero_orden="OC-001",
            proveedor=self.proveedor,
            fecha_esperada=date.today() + timedelta(days=7),
            total_estimado=Decimal('1000000.00')
        )
        self.factura.orden_compra = orden
        self.factura.save()
        
        self.assertEqual(self.factura.orden_compra, orden)
        self.assertIn(self.factura, orden.facturas_compra.all())


class DetalleFacturaCompraModelTest(TestCase):
    """Tests para el modelo DetalleFacturaCompra"""
    
    def setUp(self):
        # Crear proveedor
        self.proveedor = Proveedor.objects.create(nombre="Proveedor Test")
        
        # Crear categoría y producto
        self.categoria = Categoria.objects.create(
            nombre="Herramientas"
        )
        self.producto = Producto.objects.create(
            codigo="TOOL001",
            nombre="Martillo",
            categoria=self.categoria,
            precio_unitario=Decimal('50000.00'),
            stock_disponible=10
        )
        
        # Crear factura de compra
        self.factura = FacturaCompra.objects.create(
            numero_factura="001-001-0001236",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            subtotal=Decimal('0.00'),
            descuento=Decimal('0.00'),
            impuestos=Decimal('0.00')
        )
        
        # Crear detalle
        self.detalle = DetalleFacturaCompra.objects.create(
            factura_compra=self.factura,
            producto=self.producto,
            descripcion="Martillo de 500g",
            cantidad=Decimal('10.00'),
            precio_unitario=Decimal('25000.00'),
            lote="LOTE2024-01",
            fecha_vencimiento_lote=date.today() + timedelta(days=365)
        )
    
    def test_detalle_creacion(self):
        """Verifica que el detalle se crea correctamente"""
        self.assertEqual(self.detalle.producto, self.producto)
        self.assertEqual(self.detalle.cantidad, Decimal('10.00'))
        self.assertEqual(self.detalle.precio_unitario, Decimal('25000.00'))
    
    def test_calculo_subtotal_automatico(self):
        """Verifica que el subtotal se calcula automáticamente"""
        # 10 * 25000 = 250000
        expected_subtotal = Decimal('250000.00')
        self.assertEqual(self.detalle.subtotal, expected_subtotal)
    
    def test_detalle_str(self):
        """Verifica la representación en string"""
        expected = "Martillo x 10.00 - FC 001-001-0001236"
        self.assertEqual(str(self.detalle), expected)
    
    def test_actualizacion_subtotal_al_cambiar_cantidad(self):
        """Verifica que el subtotal se actualiza al cambiar cantidad"""
        self.detalle.cantidad = Decimal('15.00')
        self.detalle.save()
        
        # 15 * 25000 = 375000
        expected_subtotal = Decimal('375000.00')
        self.assertEqual(self.detalle.subtotal, expected_subtotal)
    
    def test_actualizacion_subtotal_al_cambiar_precio(self):
        """Verifica que el subtotal se actualiza al cambiar precio"""
        self.detalle.precio_unitario = Decimal('30000.00')
        self.detalle.save()
        
        # 10 * 30000 = 300000
        expected_subtotal = Decimal('300000.00')
        self.assertEqual(self.detalle.subtotal, expected_subtotal)
    
    def test_relacion_con_factura(self):
        """Verifica la relación con la factura de compra"""
        self.assertEqual(self.detalle.factura_compra, self.factura)
        self.assertIn(self.detalle, self.factura.detalles.all())
    
    def test_multiples_detalles_en_factura(self):
        """Verifica que una factura puede tener múltiples detalles"""
        producto2 = Producto.objects.create(
            codigo="TOOL002",
            nombre="Destornillador",
            categoria=self.categoria,
            precio_unitario=Decimal('15000.00'),
            stock_disponible=20
        )
        
        detalle2 = DetalleFacturaCompra.objects.create(
            factura_compra=self.factura,
            producto=producto2,
            cantidad=Decimal('20.00'),
            precio_unitario=Decimal('8000.00')
        )
        
        self.assertEqual(self.factura.detalles.count(), 2)
        self.assertIn(self.detalle, self.factura.detalles.all())
        self.assertIn(detalle2, self.factura.detalles.all())


class FacturaCompraIntegracionTest(TestCase):
    """Tests de integración para el flujo completo de facturas de compra"""
    
    def setUp(self):
        self.usuario = User.objects.create_user(
            username='admin',
            password='admin123'
        )
        self.proveedor = Proveedor.objects.create(nombre="Distribuidora XYZ")
        self.categoria = Categoria.objects.create(nombre="Pinturería")
        
        # Crear varios productos
        self.producto1 = Producto.objects.create(
            codigo="PAINT001",
            nombre="Pintura Blanca",
            categoria=self.categoria,
            precio_unitario=Decimal('80000.00'),
            stock_disponible=5
        )
        self.producto2 = Producto.objects.create(
            codigo="PAINT002",
            nombre="Pintura Roja",
            categoria=self.categoria,
            precio_unitario=Decimal('85000.00'),
            stock_disponible=3
        )
    
    def test_flujo_completo_factura_compra(self):
        """Test del flujo completo: crear factura y agregar detalles"""
        # 1. Crear factura
        factura = FacturaCompra.objects.create(
            numero_factura="001-002-0005678",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=45),
            tipo_factura='credito',
            estado='pendiente',
            subtotal=Decimal('0.00'),
            descuento=Decimal('0.00'),
            impuestos=Decimal('0.00'),
            condicion_pago="45 días",
            usuario_registro=self.usuario
        )
        
        # 2. Agregar detalle 1
        detalle1 = DetalleFacturaCompra.objects.create(
            factura_compra=factura,
            producto=self.producto1,
            cantidad=Decimal('10.00'),
            precio_unitario=Decimal('50000.00')
        )
        
        # 3. Agregar detalle 2
        detalle2 = DetalleFacturaCompra.objects.create(
            factura_compra=factura,
            producto=self.producto2,
            cantidad=Decimal('8.00'),
            precio_unitario=Decimal('52000.00')
        )
        
        # 4. Calcular totales
        subtotal_calculado = detalle1.subtotal + detalle2.subtotal
        # 500000 + 416000 = 916000
        self.assertEqual(subtotal_calculado, Decimal('916000.00'))
        
        # 5. Actualizar factura con totales
        factura.subtotal = subtotal_calculado
        factura.impuestos = subtotal_calculado * Decimal('0.10')  # 10% IVA
        factura.save()
        
        # 6. Verificar total final
        # 916000 + 91600 = 1007600
        self.assertEqual(factura.total, Decimal('1007600.00'))
        
        # 7. Verificar relaciones
        self.assertEqual(factura.detalles.count(), 2)
        self.assertEqual(factura.proveedor.facturas_compra.count(), 1)
    
    def test_cambio_estado_factura(self):
        """Test de cambio de estado de factura"""
        factura = FacturaCompra.objects.create(
            numero_factura="001-002-0005679",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            tipo_factura='contado',
            estado='pendiente',
            subtotal=Decimal('500000.00'),
            impuestos=Decimal('50000.00')
        )
        
        # Marcar como pagada
        factura.estado = 'pagada'
        factura.save()
        
        self.assertEqual(factura.estado, 'pagada')
        self.assertFalse(factura.esta_vencida)
    
    def test_factura_con_descuento(self):
        """Test de factura con descuento aplicado"""
        factura = FacturaCompra.objects.create(
            numero_factura="001-002-0005680",
            proveedor=self.proveedor,
            fecha_emision=date.today(),
            tipo_factura='contado',
            estado='pendiente',
            subtotal=Decimal('1000000.00'),
            descuento=Decimal('100000.00'),  # 10% descuento
            impuestos=Decimal('90000.00')     # 10% IVA sobre (subtotal - descuento)
        )
        
        # Total = 1000000 - 100000 + 90000 = 990000
        self.assertEqual(factura.total, Decimal('990000.00'))
