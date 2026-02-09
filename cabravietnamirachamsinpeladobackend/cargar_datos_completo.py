#!/usr/bin/env python
"""
Script para cargar datos de prueba reales del sistema de ferretería.
Adaptado a los modelos existentes.
"""

import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import F

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_ferreteria.settings')
django.setup()

from inventario.models import (
    Categoria, Subcategoria, Producto, Movimiento, Cliente, Factura, 
    DetalleFactura, Proveedor, OrdenCompra, DetalleOrdenCompra,
    RecepcionMercaderia, DetalleRecepcion, ProductoProveedor, FacturaCompra,
    DetalleFacturaCompra, User
)

print("🔧 Iniciando carga de datos de prueba para ferretería...")

# Limpiar datos existentes
print("\n📦 Limpiando datos anteriores...")
DetalleFactura.objects.all().delete()
Factura.objects.all().delete()
DetalleOrdenCompra.objects.all().delete()
DetalleRecepcion.objects.all().delete()
RecepcionMercaderia.objects.all().delete()
OrdenCompra.objects.all().delete()
DetalleFacturaCompra.objects.all().delete()
FacturaCompra.objects.all().delete()
Movimiento.objects.all().delete()
ProductoProveedor.objects.all().delete()
Producto.objects.all().delete()
Subcategoria.objects.all().delete()
Cliente.objects.all().delete()
Proveedor.objects.all().delete()
Categoria.objects.all().delete()

print("  ✓ Limpieza completada")

# ==========================================
# 1. CATEGORÍAS Y SUBCATEGORÍAS
# ==========================================
print("\n🏗️ Creando categorías y subcategorías...")
categorias_data = {
    "Herramientas Manuales": ["Martillos", "Destornilladores", "Llaves", "Alicates", "Sierras"],
    "Herramientas Eléctricas": ["Taladros", "Amoladoras", "Sierras", "Lijadoras", "Pistolas de Calor"],
    "Materiales de Construcción": ["Cemento", "Arena", "Ladrillos", "Cal", "Mezclas"],
    "Pintura": ["Látex", "Esmalte", "Anticorrosivo", "Barniz", "Accesorios"],
    "Plomería": ["Tuberías PVC", "Accesorios", "Grifería", "Tanques", "Herramientas"],
    "Electricidad": ["Cables", "Interruptores", "Tomacorrientes", "Iluminación", "Protección"],
    "Ferretería General": ["Tornillos", "Clavos", "Tuercas", "Arandelas", "Pernos"],
    "Jardinería": ["Herramientas Manuales", "Mangueras", "Riego", "Accesorios"],
}

categorias = {}
for cat_nombre, subcats in categorias_data.items():
    cat = Categoria.objects.create(nombre=cat_nombre)
    categorias[cat_nombre] = cat
    print(f"  ✓ {cat_nombre}")
    
    for subcat_nombre in subcats:
        Subcategoria.objects.create(nombre=subcat_nombre, categoria=cat)

# ==========================================
# 2. PROVEEDORES
# ==========================================
print("\n🚚 Creando proveedores...")
proveedores_data = [
    ("Distribuidora Ferretera del Sur", "Fernando Gómez", "0981-123456", "fernando@ferretera.com"),
    ("Importadora de Herramientas SA", "María López", "0982-234567", "maria@importadora.com"),
    ("Comercial de Construcción", "Carlos Rodríguez", "0983-345678", "carlos@comercial.com"),
    ("Pinturas Total SA", "Ana Martínez", "0984-456789", "ana@pinturastotal.com"),
    ("Plomería y Electricidad", "Jorge Benítez", "0985-567890", "jorge@plomeria.com"),
]

proveedores = []
for nombre, contacto, tel, email in proveedores_data:
    prov = Proveedor.objects.create(
        nombre=nombre,
        contacto=contacto,
        telefono=tel,
        email=email,
        direccion=f"Av. Principal {random.randint(100, 999)}, Asunción",
        activo=True
    )
    proveedores.append(prov)
    print(f"  ✓ {nombre}")

# ==========================================
# 3. PRODUCTOS
# ==========================================
print("\n🔨 Creando productos...")

marcas_herramientas = ["Bosch", "Makita", "DeWalt", "Stanley", "Black+Decker", "Truper", "Pretul", "Klein Tools", "Milwaukee"]
marcas_pintura = ["Sherwin-Williams", "Comex", "Behr", "Valspar", "Pinturas INC"]
marcas_plomeria = ["Tigre", "Pavco", "FV", "Rotoplas", "Roca"]
marcas_electricidad = ["Pirelli", "Bticino", "3M", "Philips", "Schneider"]

productos_data = [
    # Herramientas Manuales
    ("Martillo de Bola 16oz", "Herramientas Manuales", "Martillos", "Stanley", 75000, 125000, "UND", 45),
    ("Martillo de Uña 20oz", "Herramientas Manuales", "Martillos", "Truper", 68000, 110000, "UND", 38),
    ("Destornillador Phillips #2", "Herramientas Manuales", "Destornilladores", "Stanley", 22000, 38000, "UND", 65),
    ("Destornillador Plano 1/4\"", "Herramientas Manuales", "Destornilladores", "Klein Tools", 25000, 42000, "UND", 55),
    ("Alicate Universal 8\"", "Herramientas Manuales", "Alicates", "Klein Tools", 85000, 142000, "UND", 30),
    ("Alicate de Corte 6\"", "Herramientas Manuales", "Alicates", "Stanley", 65000, 105000, "UND", 28),
    ("Llave Inglesa 12\"", "Herramientas Manuales", "Llaves", "Truper", 58000, 95000, "UND", 25),
    ("Llave Stillson 14\"", "Herramientas Manuales", "Llaves", "Pretul", 72000, 118000, "UND", 20),
    ("Sierra de Mano 20\"", "Herramientas Manuales", "Sierras", "Pretul", 42000, 68000, "UND", 18),
    ("Serrucho Brasil 22\"", "Herramientas Manuales", "Sierras", "Truper", 48000, 75000, "UND", 22),
    
    # Herramientas Eléctricas
    ("Taladro Percutor 1/2\" 600W", "Herramientas Eléctricas", "Taladros", "Bosch", 420000, 680000, "UND", 8),
    ("Taladro Inalámbrico 18V", "Herramientas Eléctricas", "Taladros", "Makita", 550000, 850000, "UND", 5),
    ("Amoladora Angular 4.5\" 850W", "Herramientas Eléctricas", "Amoladoras", "Makita", 350000, 550000, "UND", 6),
    ("Amoladora Grande 7\" 2000W", "Herramientas Eléctricas", "Amoladoras", "DeWalt", 480000, 720000, "UND", 4),
    ("Sierra Circular 7.25\" 1500W", "Herramientas Eléctricas", "Sierras", "DeWalt", 580000, 890000, "UND", 5),
    ("Lijadora Orbital 230W", "Herramientas Eléctricas", "Lijadoras", "Black+Decker", 250000, 420000, "UND", 10),
    ("Lijadora de Banda 950W", "Herramientas Eléctricas", "Lijadoras", "Bosch", 380000, 580000, "UND", 7),
    
    # Materiales de Construcción  
    ("Cemento Portland 50kg", "Materiales de Construcción", "Cemento", "INC", 45000, 65000, "BOL", 180),
    ("Cemento Blanco 50kg", "Materiales de Construcción", "Cemento", "INC", 55000, 82000, "BOL", 85),
    ("Arena Fina m³", "Materiales de Construcción", "Arena", "Local", 75000, 120000, "M3", 30),
    ("Arena Gruesa m³", "Materiales de Construcción", "Arena", "Local", 70000, 115000, "M3", 25),
    ("Ladrillo Común 6 Huecos", "Materiales de Construcción", "Ladrillos", "Yvy", 420, 650, "UND", 5500),
    ("Ladrillo Macizo", "Materiales de Construcción", "Ladrillos", "Yvy", 550, 850, "UND", 3200),
    ("Cal Hidratada 25kg", "Materiales de Construcción", "Cal", "INC", 28000, 48000, "BOL", 95),
    
    # Pintura
    ("Pintura Látex Blanco 20L", "Pintura", "Látex", "Sherwin-Williams", 280000, 480000, "LTS", 42),
    ("Pintura Látex Color 20L", "Pintura", "Látex", "Comex", 320000, 520000, "LTS", 35),
    ("Esmalte Sintético Blanco 4L", "Pintura", "Esmalte", "Comex", 165000, 270000, "LTS", 28),
    ("Esmalte Sintético Color 4L", "Pintura", "Esmalte", "Sherwin-Williams", 180000, 295000, "LTS", 25),
    ("Anticorrosivo Gris 4L", "Pintura", "Anticorrosivo", "Behr", 145000, 235000, "LTS", 32),
    ("Barniz Marino 4L", "Pintura", "Barniz", "Valspar", 195000, 310000, "LTS", 18),
    ("Brocha 3\" Cerda Natural", "Pintura", "Accesorios", "Truper", 16000, 28000, "UND", 85),
    ("Rodillo 9\" con Mango", "Pintura", "Accesorios", "Pretul", 32000, 52000, "UND", 65),
    ("Cinta Enmascarar 2\" x 40m", "Pintura", "Accesorios", "3M", 20000, 35000, "UND", 110),
    
    # Plomería
    ("Tubo PVC 1/2\" x 6m", "Plomería", "Tuberías PVC", "Tigre", 25000, 42000, "UND", 145),
    ("Tubo PVC 3/4\" x 6m", "Plomería", "Tuberías PVC", "Tigre", 35000, 58000, "UND", 125),
    ("Tubo PVC 1\" x 6m", "Plomería", "Tuberías PVC", "Pavco", 48000, 75000, "UND", 95),
    ("Codo PVC 1/2\" 90°", "Plomería", "Accesorios", "Pavco", 3200, 5500, "UND", 420),
    ("Codo PVC 3/4\" 90°", "Plomería", "Accesorios", "Tigre", 4500, 7200, "UND", 380),
    ("Tee PVC 1/2\"", "Plomería", "Accesorios", "Tigre", 4800, 7800, "UND", 350),
    ("Grifo Lavatorio Cromado", "Plomería", "Grifería", "FV", 135000, 225000, "UND", 18),
    ("Grifo Cocina Mono comando", "Plomería", "Grifería", "Roca", 185000, 295000, "UND", 12),
    ("Tanque de Agua 500L", "Plomería", "Tanques", "Rotoplas", 350000, 565000, "UND", 10),
    ("Tanque de Agua 1000L", "Plomería", "Tanques", "Rotoplas", 550000, 850000, "UND", 6),
    ("Cinta Teflón 3/4\" x 10m", "Plomería", "Herramientas", "Truper", 4000, 7000, "UND", 250),
    
    # Electricidad
    ("Cable THW 12 AWG", "Electricidad", "Cables", "Pirelli", 7500, 13000, "MTS", 520),
    ("Cable THW 14 AWG", "Electricidad", "Cables", "Pirelli", 5500, 9500, "MTS", 680),
    ("Cable Portero 2x18", "Electricidad", "Cables", "Pirelli", 3200, 5500, "MTS", 450),
    ("Interruptor Simple", "Electricidad", "Interruptores", "Bticino", 16000, 28000, "UND", 95),
    ("Interruptor Doble", "Electricidad", "Interruptores", "Bticino", 24000, 39000, "UND", 75),
    ("Interruptor Triple", "Electricidad", "Interruptores", "Schneider", 32000, 52000, "UND", 55),
    ("Tomacorriente Doble", "Electricidad", "Tomacorrientes", "Bticino", 20000, 34000, "UND", 85),
    ("Tomacorriente Triple", "Electricidad", "Tomacorrientes", "Schneider", 28000, 45000, "UND", 65),
    ("Cinta Aislante 3M", "Electricidad", "Protección", "3M", 11000, 19000, "UND", 145),
    ("Foco LED 9W", "Electricidad", "Iluminación", "Philips", 22000, 35000, "UND", 120),
    ("Foco LED 12W", "Electricidad", "Iluminación", "Philips", 26000, 42000, "UND", 105),
    ("Tubo LED 18W 120cm", "Electricidad", "Iluminación", "Philips", 55000, 85000, "UND", 45),
    
    # Ferretería General
    ("Tornillo Autoperforante 6x1\" (caja)", "Ferretería General", "Tornillos", "Local", 15000, 25000, "CAJ", 85),
    ("Tornillo Tirafondo 1/4\"x2\" (caja)", "Ferretería General", "Tornillos", "Local", 22000, 35000, "CAJ", 65),
    ("Clavo de 2\" (kg)", "Ferretería General", "Clavos", "Local", 18000, 28000, "KG", 125),
    ("Clavo de 3\" (kg)", "Ferretería General", "Clavos", "Local", 19000, 30000, "KG", 110),
    ("Tuerca Hexagonal 1/4\" (caja)", "Ferretería General", "Tuercas", "Local", 12000, 20000, "CAJ", 95),
    ("Arandela Plana 1/4\" (caja)", "Ferretería General", "Arandelas", "Local", 8000, 14000, "CAJ", 105),
    ("Perno 1/4\"x2\" (caja)", "Ferretería General", "Pernos", "Local", 16000, 26000, "CAJ", 75),
    
    # Jardinería
    ("Pala Redonda Mango Largo", "Jardinería", "Herramientas Manuales", "Truper", 68000, 110000, "UND", 24),
    ("Pala Cuadrada Mango Largo", "Jardinería", "Herramientas Manuales", "Truper", 72000, 115000, "UND", 20),
    ("Rastrillo 14 Dientes", "Jardinería", "Herramientas Manuales", "Truper", 50000, 82000, "UND", 18),
    ("Azadón con Mango", "Jardinería", "Herramientas Manuales", "Pretul", 58000, 92000, "UND", 16),
    ("Manguera de Jardín 1/2\" 15m", "Jardinería", "Mangueras", "Local", 85000, 145000, "UND", 28),
    ("Manguera de Jardín 3/4\" 20m", "Jardinería", "Mangueras", "Local", 120000, 195000, "UND", 18),
    ("Aspersor Giratorio", "Jardinería", "Riego", "Local", 32000, 52000, "UND", 35),
    ("Tijera de Podar 8\"", "Jardinería", "Herramientas Manuales", "Truper", 38000, 65000, "UND", 32),
]

productos = []
for i, (nombre, cat_nombre, subcat_nombre, marca, costo, precio, unidad, stock) in enumerate(productos_data, 1):
    cat = categorias[cat_nombre]
    subcat = Subcategoria.objects.filter(nombre=subcat_nombre, categoria=cat).first()
    
    producto = Producto.objects.create(
        codigo=f"PROD{i:04d}",
        nombre=nombre,
        categoria=cat,
        subcategoria=subcat,
        marca=marca,
        precio_costo=Decimal(str(costo)),
        precio_unitario=Decimal(str(precio)),
        stock_disponible=stock,
        stock_minimo=int(stock * 0.25),
        unidad_medida=unidad,
        activo=True
    )
    productos.append(producto)

print(f"  ✓ {len(productos)} productos creados")

# ==========================================
# 4. CLIENTES
# ==========================================
print("\n👥 Creando clientes...")
clientes_data = [
    ("Juan Pérez Gómez", "cedula", "1234567", "0981-111111", "Av. España 123", "juan.perez@email.com"),
    ("María González López", "cedula", "2345678", "0982-222222", "Calle Palma 456", "maria.gonzalez@email.com"),
    ("Carlos López Martínez", "ruc", "80034567-3", "0983-333333", "Av. Mariscal López 789", "carlos.lopez@email.com"),
    ("Ana Martínez Silva", "cedula", "4567890", "0984-444444", "Calle Eligio Ayala 321", "ana.martinez@email.com"),
    ("Roberto Silva Benítez", "ruc", "80045678-4", "0985-555555", "Av. Eusebio Ayala 654", "roberto.silva@email.com"),
    ("Laura Benítez Romero", "cedula", "6789012", "0986-666666", "Calle Colón 987", "laura.benitez@email.com"),
    ("Diego Ramírez Torres", "cedula", "7890123", "0987-777777", "Av. San Martín 147", "diego.ramirez@email.com"),
    ("Sofía Romero Fernández", "ruc", "80056789-5", "0988-888888", "Calle Brasil 258", "sofia.romero@email.com"),
    ("Cliente General", "ninguno", "", "0000-000000", "N/A", ""),
]

clientes = []
for nombre, tipo_doc, num_doc, tel, dir, email in clientes_data:
    cliente = Cliente.objects.create(
        nombre=nombre,
        tipo_documento=tipo_doc,
        numero_documento=num_doc if num_doc else None,
        telefono=tel,
        direccion=dir,
        email=email if email else None,
        activo=True
    )
    clientes.append(cliente)
    print(f"  ✓ {nombre}")

# ==========================================
# 5. ÓRDENES DE COMPRA Y RECEPCIONES
# ==========================================
print("\n📦 Creando órdenes de compra y recepciones...")
fecha_base = datetime.now() - timedelta(days=60)

for i in range(10):
    fecha_esperada = datetime.now().date() + timedelta(days=random.randint(1, 7))
    proveedor = random.choice(proveedores)
    
    orden = OrdenCompra.objects.create(
        numero_orden=f"OC-{datetime.now().year}-{i+1:04d}",
        proveedor=proveedor,
        fecha_esperada=fecha_esperada,
        total_estimado=Decimal('0'),
        estado='completa',
        observaciones=f"Orden de compra - {proveedor.nombre}"
    )
    
    total_orden = Decimal('0')
    productos_orden = random.sample(productos, random.randint(4, 10))
    
    for prod in productos_orden:
        cantidad = random.randint(15, 60)
        subtotal = prod.precio_costo * cantidad
        total_orden += subtotal
        
        DetalleOrdenCompra.objects.create(
            orden_compra=orden,
            producto=prod,
            cantidad_solicitada=cantidad,
            cantidad_recibida=cantidad,
            precio_unitario=prod.precio_costo,
            subtotal=subtotal
        )
    
    orden.total_estimado = total_orden
    orden.save()
    
    # Crear recepción
    recepcion = RecepcionMercaderia.objects.create(
        orden_compra=orden,
        proveedor=proveedor,
        numero_recepcion=f"REC-{datetime.now().strftime('%Y%m%d')}-{i+1:03d}",
        observaciones=f"Recepción completa de orden {orden.numero_orden}"
    )
    
    for detalle in orden.detalles.all():
        DetalleRecepcion.objects.create(
            recepcion=recepcion,
            producto=detalle.producto,
            cantidad_recibida=detalle.cantidad_recibida,
            precio_unitario=detalle.precio_unitario
        )
        
        # Movimiento de entrada - el signal actualizará el stock automáticamente
        Movimiento.objects.create(
            producto=detalle.producto,
            tipo='entrada',
            cantidad=detalle.cantidad_recibida,
            descripcion=f"Recepción #{recepcion.numero_recepcion}"
        )
    
    print(f"  ✓ Orden #{orden.numero_orden} - {proveedor.nombre} - ₲{total_orden:,.0f}")

# ==========================================
# 6. FACTURAS DE VENTA
# ==========================================
print("\n💰 Creando facturas de venta...")

for i in range(50):
    cliente = random.choice(clientes)
    
    factura = Factura.objects.create(
        tipo_documento=cliente.tipo_documento,
        numero_documento=cliente.numero_documento,
        nombre_cliente=cliente.nombre,
        email_cliente=cliente.email,
        telefono_cliente=cliente.telefono,
        direccion_cliente=cliente.direccion,
        subtotal=Decimal('0'),
        descuento_total=Decimal('0'),
        impuesto_total=Decimal('0'),
        total=Decimal('0'),
        exonerado_iva=False
    )
    
    subtotal_factura = Decimal('0')
    productos_venta = random.sample(productos, random.randint(1, 7))
    
    for prod in productos_venta:
        if prod.stock_disponible > 0:
            cantidad = min(random.randint(1, 5), prod.stock_disponible)
            precio = prod.precio_unitario
            subtotal = precio * cantidad
            subtotal_factura += subtotal
            
            DetalleFactura.objects.create(
                factura=factura,
                producto=prod,
                cantidad=cantidad,
                precio_unitario=precio,
                subtotal=subtotal
            )
            
            # Movimiento de salida - el signal actualizará el stock
            Movimiento.objects.create(
                producto=prod,
                tipo='salida',
                cantidad=cantidad,
                descripcion=f"Factura #{factura.numero_factura}"
            )
            
            # Refrescar el producto para actualizar el stock en memoria
            prod.refresh_from_db()
    
    # Calcular IVA (10%)
    iva = subtotal_factura * Decimal('0.1') if not factura.exonerado_iva else Decimal('0')
    
    factura.subtotal = subtotal_factura
    factura.impuesto_total = iva
    factura.total = subtotal_factura + iva
    factura.save()
    
    if i % 10 == 0:
        print(f"  ✓ {i+1} facturas creadas...")

print(f"  ✓ Total: 50 facturas creadas")

# ==========================================
# RESUMEN FINAL
# ==========================================
print("\n" + "="*70)
print("✅ CARGA DE DATOS COMPLETADA EXITOSAMENTE")
print("="*70)
print(f"📁 Categorías:            {Categoria.objects.count()}")
print(f"📂 Subcategorías:         {Subcategoria.objects.count()}")
print(f"🔨 Productos:             {Producto.objects.count()}")
print(f"🚚 Proveedores:           {Proveedor.objects.count()}")
print(f"👥 Clientes:              {Cliente.objects.count()}")
print(f"📦 Órdenes de Compra:     {OrdenCompra.objects.count()}")
print(f"📥 Recepciones:           {RecepcionMercaderia.objects.count()}")
print(f"💰 Facturas de Venta:     {Factura.objects.count()}")
print(f"📋 Detalles Factura:      {DetalleFactura.objects.count()}")
print(f"🔄 Movimientos de Stock:  {Movimiento.objects.count()}")
print("="*70)

# Estadísticas adicionales
total_ventas = sum(f.total for f in Factura.objects.all())
productos_bajo_stock = Producto.objects.filter(stock_disponible__lte=F('stock_minimo')).count()

print(f"\n📊 ESTADÍSTICAS:")
print(f"   💵 Total Ventas:         ₲{total_ventas:,.0f}")
print(f"   ⚠️  Productos Stock Bajo: {productos_bajo_stock}")
print(f"   ✅ Productos Activos:    {Producto.objects.filter(activo=True).count()}")
print("="*70)
print("🎉 Sistema listo para pruebas!")
print("🌐 Accede al dashboard: http://localhost:4200")
print("="*70)
