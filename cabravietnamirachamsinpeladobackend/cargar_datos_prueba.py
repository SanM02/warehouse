#!/usr/bin/env python
"""
Script para cargar datos de prueba en todos los módulos del sistema de ferretería.
Ejecutar: python manage.py shell < cargar_datos_prueba.py
"""

import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_ferreteria.settings')
django.setup()

from inventario.models import (
    Categoria, Marca, Producto, Proveedor, Cliente, Empleado,
    Factura, DetalleFactura, Compra, DetalleCompra, RecepcionMercaderia,
    MovimientoStock, HistorialPrecios, Ajuste, User
)

print("🔧 Iniciando carga de datos de prueba para ferretería...")

# Limpiar datos existentes
print("\n📦 Limpiando datos anteriores...")
DetalleFactura.objects.all().delete()
Factura.objects.all().delete()
DetalleCompra.objects.all().delete()
RecepcionMercaderia.objects.all().delete()
Compra.objects.all().delete()
MovimientoStock.objects.all().delete()
HistorialPrecios.objects.all().delete()
Ajuste.objects.all().delete()
Producto.objects.all().delete()
Cliente.objects.all().delete()
Empleado.objects.all().delete()
Proveedor.objects.all().delete()
Marca.objects.all().delete()
Categoria.objects.all().delete()

# ==========================================
# 1. CATEGORÍAS
# ==========================================
print("\n🏗️ Creando categorías...")
categorias_data = [
    ("Herramientas Manuales", "Herramientas de mano y accesorios"),
    ("Herramientas Eléctricas", "Herramientas con motor eléctrico"),
    ("Materiales de Construcción", "Cemento, arena, ladrillos, etc."),
    ("Pintura y Accesorios", "Pinturas, brochas, rodillos"),
    ("Plomería", "Tuberías, grifos, accesorios sanitarios"),
    ("Electricidad", "Cables, enchufes, interruptores"),
    ("Ferretería General", "Tornillos, clavos, tuercas"),
    ("Jardinería", "Herramientas y productos para jardín"),
]

categorias = {}
for nombre, desc in categorias_data:
    cat = Categoria.objects.create(nombre=nombre, descripcion=desc)
    categorias[nombre] = cat
    print(f"  ✓ {nombre}")

# ==========================================
# 2. MARCAS
# ==========================================
print("\n🏷️ Creando marcas...")
marcas_data = [
    "Bosch", "Makita", "DeWalt", "Stanley", "Black+Decker",
    "Truper", "Pretul", "Urrea", "Klein Tools", "Milwaukee",
    "Sherwin-Williams", "Comex", "Behr", "Valspar",
    "Rotoplas", "Tigre", "Pavco", "FV", "Roca"
]

marcas = {}
for nombre in marcas_data:
    marca = Marca.objects.create(nombre=nombre)
    marcas[nombre] = marca
    print(f"  ✓ {nombre}")

# ==========================================
# 3. PROVEEDORES
# ==========================================
print("\n🚚 Creando proveedores...")
proveedores_data = [
    ("Distribuidora Ferretera del Sur", "Fernando Gómez", "0981-123456", "Fernando.gomez@ferretera.com"),
    ("Importadora de Herramientas SA", "María López", "0982-234567", "maria.lopez@importadora.com"),
    ("Comercial de Construcción", "Carlos Rodríguez", "0983-345678", "carlos.rodriguez@comercial.com"),
    ("Pinturas y Más", "Ana Martínez", "0984-456789", "ana.martinez@pinturas.com"),
    ("Plomería Total", "Jorge Benítez", "0985-567890", "jorge.benitez@plomeria.com"),
]

proveedores = []
for nombre, contacto, tel, email in proveedores_data:
    prov = Proveedor.objects.create(
        nombre=nombre,
        persona_contacto=contacto,
        telefono=tel,
        email=email,
        direccion=f"Av. Principal {random.randint(100, 999)}, Asunción"
    )
    proveedores.append(prov)
    print(f"  ✓ {nombre}")

# ==========================================
# 4. PRODUCTOS
# ==========================================
print("\n🔨 Creando productos...")
productos_data = [
    # Herramientas Manuales
    ("Martillo de Bola 16oz", "Herramientas Manuales", "Stanley", 85000, 125000, "UND", 45),
    ("Destornillador Phillips #2", "Herramientas Manuales", "Stanley", 25000, 38000, "UND", 60),
    ("Alicate Universal 8\"", "Herramientas Manuales", "Klein Tools", 95000, 142000, "UND", 30),
    ("Llave Inglesa 12\"", "Herramientas Manuales", "Truper", 68000, 98000, "UND", 25),
    ("Sierra de Mano 20\"", "Herramientas Manuales", "Pretul", 45000, 67000, "UND", 18),
    
    # Herramientas Eléctricas
    ("Taladro Percutor 1/2\" 600W", "Herramientas Eléctricas", "Bosch", 450000, 680000, "UND", 8),
    ("Amoladora Angular 4.5\" 850W", "Herramientas Eléctricas", "Makita", 380000, 550000, "UND", 6),
    ("Sierra Circular 7.25\" 1500W", "Herramientas Eléctricas", "DeWalt", 620000, 890000, "UND", 5),
    ("Lijadora Orbital 230W", "Herramientas Eléctricas", "Black+Decker", 280000, 420000, "UND", 10),
    
    # Materiales de Construcción
    ("Cemento Portland 50kg", "Materiales de Construcción", "INC", 48000, 65000, "BOL", 150),
    ("Arena Fina", "Materiales de Construcción", "Local", 85000, 120000, "M3", 25),
    ("Ladrillo Común", "Materiales de Construcción", "Yvy", 450, 650, "UND", 5000),
    ("Cal Hidratada 25kg", "Materiales de Construcción", "INC", 32000, 48000, "BOL", 80),
    
    # Pintura y Accesorios
    ("Pintura Látex Blanco 20L", "Pintura y Accesorios", "Sherwin-Williams", 320000, 480000, "LTS", 35),
    ("Pintura Esmalte Sintético 4L", "Pintura y Accesorios", "Comex", 180000, 270000, "LTS", 28),
    ("Brocha 3\"", "Pintura y Accesorios", "Truper", 18000, 28000, "UND", 75),
    ("Rodillo 9\" con Mango", "Pintura y Accesorios", "Pretul", 35000, 52000, "UND", 50),
    ("Cinta de Enmascarar 2\"", "Pintura y Accesorios", "3M", 22000, 35000, "UND", 90),
    
    # Plomería
    ("Tubo PVC 1/2\" 6m", "Plomería", "Tigre", 28000, 42000, "UND", 120),
    ("Codo PVC 1/2\"", "Plomería", "Pavco", 3500, 5500, "UND", 350),
    ("Grifo Lavatorio Cromado", "Plomería", "FV", 150000, 225000, "UND", 15),
    ("Tanque de Agua 500L", "Plomería", "Rotoplas", 380000, 565000, "UND", 8),
    ("Cinta Teflón 3/4\"", "Plomería", "Truper", 4500, 7000, "UND", 200),
    
    # Electricidad
    ("Cable THW 12 AWG", "Electricidad", "Pirelli", 8500, 13000, "MTS", 450),
    ("Interruptor Simple", "Electricidad", "Bticino", 18000, 28000, "UND", 85),
    ("Tomacorriente Doble", "Electricidad", "Bticino", 22000, 34000, "UND", 70),
    ("Cinta Aislante 3M", "Electricidad", "3M", 12000, 19000, "UND", 120),
    ("Foco LED 12W", "Electricidad", "Philips", 28000, 42000, "UND", 95),
    
    # Ferretería General
    ("Tornillo Autoperforante 6x1\"", "Ferretería General", "Urrea", 180, 300, "UND", 2500),
    ("Clavo de 2\" (paquete 500g)", "Ferretería General", "Local", 12000, 18000, "PKT", 150),
    ("Tuerca Hexagonal 1/4\"", "Ferretería General", "Urrea", 250, 400, "UND", 1800),
    ("Arandela Plana 1/4\"", "Ferretería General", "Urrea", 120, 200, "UND", 2200),
    
    # Jardinería
    ("Pala Redonda Mango Largo", "Jardinería", "Truper", 75000, 110000, "UND", 22),
    ("Rastrillo 14 Dientes", "Jardinería", "Truper", 55000, 82000, "UND", 18),
    ("Manguera de Jardín 1/2\" 15m", "Jardinería", "Karcher", 95000, 145000, "UND", 25),
    ("Tijera de Podar 8\"", "Jardinería", "Truper", 42000, 65000, "UND", 30),
]

productos = []
for nombre, cat_nombre, marca_nombre, costo, precio, unidad, stock in productos_data:
    prod = Producto.objects.create(
        nombre=nombre,
        codigo=f"PROD{random.randint(1000, 9999)}",
        categoria=categorias[cat_nombre],
        marca=marcas.get(marca_nombre),
        precio_costo=Decimal(str(costo)),
        precio_venta=Decimal(str(precio)),
        stock_actual=stock,
        stock_minimo=int(stock * 0.2),
        unidad_medida=unidad
    )
    productos.append(prod)
    print(f"  ✓ {nombre}")

# ==========================================
# 5. CLIENTES
# ==========================================
print("\n👥 Creando clientes...")
clientes_data = [
    ("Juan Pérez", "1234567", "0981-111111", "Av. España 123", "juan.perez@email.com"),
    ("María González", "2345678", "0982-222222", "Calle Palma 456", "maria.gonzalez@email.com"),
    ("Carlos López", "3456789", "0983-333333", "Av. Mariscal López 789", "carlos.lopez@email.com"),
    ("Ana Martínez", "4567890", "0984-444444", "Calle Eligio Ayala 321", "ana.martinez@email.com"),
    ("Roberto Silva", "5678901", "0985-555555", "Av. Eusebio Ayala 654", "roberto.silva@email.com"),
    ("Laura Benítez", "6789012", "0986-666666", "Calle Colón 987", "laura.benitez@email.com"),
    ("Diego Ramírez", "7890123", "0987-777777", "Av. San Martín 147", "diego.ramirez@email.com"),
    ("Sofía Romero", "8901234", "0988-888888", "Calle Brasil 258", "sofia.romero@email.com"),
]

clientes = []
for nombre, ruc, tel, dir, email in clientes_data:
    cliente = Cliente.objects.create(
        nombre=nombre,
        ruc=ruc,
        telefono=tel,
        direccion=dir,
        email=email
    )
    clientes.append(cliente)
    print(f"  ✓ {nombre}")

# ==========================================
# 6. EMPLEADOS
# ==========================================
print("\n👔 Creando empleados...")
empleados_data = [
    ("Pedro González", "Vendedor", "vendedor@ferreteria.com", "0981-100100"),
    ("Lucía Fernández", "Cajera", "cajera@ferreteria.com", "0982-200200"),
    ("Miguel Ángel Torres", "Encargado de Almacén", "almacen@ferreteria.com", "0983-300300"),
]

empleados = []
for nombre, cargo, email, tel in empleados_data:
    emp = Empleado.objects.create(
        nombre=nombre,
        cargo=cargo,
        email=email,
        telefono=tel
    )
    empleados.append(emp)
    print(f"  ✓ {nombre} - {cargo}")

# ==========================================
# 7. COMPRAS Y RECEPCIONES
# ==========================================
print("\n📦 Creando compras y recepciones de mercadería...")
fecha_base = datetime.now() - timedelta(days=60)

for i in range(8):
    fecha_compra = fecha_base + timedelta(days=random.randint(0, 50))
    proveedor = random.choice(proveedores)
    
    compra = Compra.objects.create(
        proveedor=proveedor,
        fecha_compra=fecha_compra,
        total=Decimal('0'),
        estado='completada',
        numero_factura=f"FC-{random.randint(10000, 99999)}"
    )
    
    # Número de recepción único
    numero_recepcion = f"REC-{fecha_compra.strftime('%Y%m%d')}-{random.randint(100, 999)}"
    
    recepcion = RecepcionMercaderia.objects.create(
        compra=compra,
        numero_recepcion=numero_recepcion,
        estado='completada',
        observaciones=f"Recepción de mercadería - {proveedor.nombre}"
    )
    
    total_compra = Decimal('0')
    productos_compra = random.sample(productos, random.randint(3, 8))
    
    for prod in productos_compra:
        cantidad = random.randint(10, 50)
        subtotal = prod.precio_costo * cantidad
        total_compra += subtotal
        
        DetalleCompra.objects.create(
            compra=compra,
            producto=prod,
            cantidad=cantidad,
            precio_unitario=prod.precio_costo,
            subtotal=subtotal
        )
        
        # Crear recepción de mercadería
        RecepcionMercaderia.objects.create(
            compra=compra,
            producto=prod,
            cantidad_recibida=cantidad,
            numero_recepcion=f"{numero_recepcion}-{prod.codigo}",
            estado='completada'
        )
        
        # Actualizar stock
        prod.stock_actual += cantidad
        prod.save()
    
    compra.total = total_compra
    compra.save()
    print(f"  ✓ Compra #{compra.id} - {proveedor.nombre} - ₲{total_compra:,.0f}")

# ==========================================
# 8. FACTURAS DE VENTA
# ==========================================
print("\n💰 Creando facturas de venta...")
fecha_base = datetime.now() - timedelta(days=30)

for i in range(35):
    dias_atras = random.randint(0, 29)
    fecha_venta = fecha_base + timedelta(days=dias_atras)
    cliente = random.choice(clientes)
    empleado = random.choice(empleados)
    
    factura = Factura.objects.create(
        cliente=cliente,
        fecha=fecha_venta,
        total=Decimal('0'),
        metodo_pago=random.choice(['efectivo', 'tarjeta', 'transferencia']),
        empleado=empleado
    )
    
    total_factura = Decimal('0')
    productos_venta = random.sample(productos, random.randint(1, 6))
    
    for prod in productos_venta:
        if prod.stock_actual > 0:
            cantidad = min(random.randint(1, 5), prod.stock_actual)
            subtotal = prod.precio_venta * cantidad
            total_factura += subtotal
            
            DetalleFactura.objects.create(
                factura=factura,
                producto=prod,
                cantidad=cantidad,
                precio_unitario=prod.precio_venta,
                subtotal=subtotal
            )
            
            # Actualizar stock
            prod.stock_actual -= cantidad
            prod.save()
            
            # Registrar movimiento de stock
            MovimientoStock.objects.create(
                producto=prod,
                tipo_movimiento='venta',
                cantidad=cantidad,
                fecha=fecha_venta,
                referencia=f"Factura #{factura.id}"
            )
    
    factura.total = total_factura
    factura.save()
    print(f"  ✓ Factura #{factura.id} - {cliente.nombre} - ₲{total_factura:,.0f}")

# ==========================================
# 9. HISTORIAL DE PRECIOS
# ==========================================
print("\n📊 Creando historial de precios...")
fecha_base = datetime.now() - timedelta(days=90)

for prod in random.sample(productos, 15):
    for i in range(random.randint(1, 3)):
        fecha = fecha_base + timedelta(days=random.randint(0, 80))
        precio_anterior = prod.precio_venta * Decimal(str(random.uniform(0.85, 0.95)))
        
        HistorialPrecios.objects.create(
            producto=prod,
            precio_anterior=precio_anterior,
            precio_nuevo=prod.precio_venta,
            fecha_cambio=fecha,
            motivo="Ajuste de mercado"
        )

print(f"  ✓ Historial creado para 15 productos")

# ==========================================
# 10. AJUSTES DE INVENTARIO
# ==========================================
print("\n🔧 Creando ajustes de inventario...")
for i in range(5):
    prod = random.choice(productos)
    tipo = random.choice(['entrada', 'salida'])
    cantidad = random.randint(5, 20)
    
    ajuste = Ajuste.objects.create(
        producto=prod,
        tipo_ajuste=tipo,
        cantidad=cantidad,
        motivo=random.choice(['Inventario físico', 'Producto dañado', 'Corrección contable']),
        fecha=datetime.now() - timedelta(days=random.randint(1, 20))
    )
    
    if tipo == 'entrada':
        prod.stock_actual += cantidad
    else:
        prod.stock_actual = max(0, prod.stock_actual - cantidad)
    prod.save()
    
    print(f"  ✓ Ajuste {tipo} - {prod.nombre} - {cantidad} unidades")

# ==========================================
# RESUMEN
# ==========================================
print("\n" + "="*60)
print("✅ CARGA DE DATOS COMPLETADA")
print("="*60)
print(f"📁 Categorías:        {Categoria.objects.count()}")
print(f"🏷️  Marcas:            {Marca.objects.count()}")
print(f"🔨 Productos:         {Producto.objects.count()}")
print(f"🚚 Proveedores:       {Proveedor.objects.count()}")
print(f"👥 Clientes:          {Cliente.objects.count()}")
print(f"👔 Empleados:         {Empleado.objects.count()}")
print(f"📦 Compras:           {Compra.objects.count()}")
print(f"💰 Facturas:          {Factura.objects.count()}")
print(f"📋 Detalles Factura:  {DetalleFactura.objects.count()}")
print(f"🔄 Movimientos Stock: {MovimientoStock.objects.count()}")
print(f"📊 Historial Precios: {HistorialPrecios.objects.count()}")
print(f"🔧 Ajustes:           {Ajuste.objects.count()}")
print(f"📥 Recepciones:       {RecepcionMercaderia.objects.count()}")
print("="*60)
print("🎉 Sistema listo para pruebas!")
print("🌐 Accede al dashboard: http://localhost:4200")
print("="*60)
