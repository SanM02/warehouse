# 🛠️ PROMPT TÉCNICO PARA REFACTORIZACIÓN
## Sistema de Facturación - Ferretería J&G
### Documento de Ingeniería para Programador (Sonnet)

---

## 📋 CONTEXTO GENERAL

**Archivo Principal a Modificar:** `cabravietnamirachamsinpeladobackend/inventario/serializers.py`  
**Método Objetivo:** `FacturaSerializer.create()` (líneas 90-172)  
**Archivos Relacionados:**
- `inventario/signals.py` - Signal que actualiza stock automáticamente
- `inventario/models.py` - Modelos Factura, DetalleFactura, Producto, Movimiento
- Frontend: `facturacion.component.ts` - Cálculos del lado cliente

---

## 🚨 BUGS CRÍTICOS IDENTIFICADOS

### BUG #1: DOBLE SUSTRACCIÓN DE STOCK (CRÍTICO - DATA LOSS)

**Ubicación:** `serializers.py` líneas 117-118 + `signals.py` líneas 6-13

**Problema:**
```python
# serializers.py línea 117-118:
producto.stock_disponible -= cantidad
producto.save()

# serializers.py línea 133-139:
Movimiento.objects.create(
    producto=producto,
    tipo='salida',
    cantidad=cantidad,
    ...
)
```

El signal en `signals.py` TAMBIÉN resta el stock cuando se crea el Movimiento:
```python
@receiver(post_save, sender=Movimiento)
def actualizar_stock(sender, instance, created, **kwargs):
    if created:
        producto = instance.producto
        if instance.tipo == 'salida':
            producto.stock_disponible -= instance.cantidad  # <-- SEGUNDA RESTA!
        producto.save()
```

**Resultado:** Stock se resta 2 veces. Ejemplo: Venta de 5 unidades resta 10.

---

### BUG #2: FALTA DE ATOMICIDAD (CRÍTICO - DATA LOSS)

**Ubicación:** `serializers.py` líneas 90-172

**Problema:** El método no usa `transaction.atomic()`. Si ocurre un error después de modificar algunos productos pero antes de completar la factura:
- Los productos ya modificados quedan con stock incorrecto
- El `try/except` solo borra la factura, NO revierte:
  - Cambios de stock en `Producto`
  - `DetalleFactura` creados
  - `Movimiento` creados

**Escenario de Fallo:**
1. Factura con 3 productos: A (stock 100), B (stock 50), C (stock 2)
2. Se piden: A=5, B=10, C=10 (C no tiene suficiente)
3. Se procesa A: stock → 95 ✓
4. Se procesa B: stock → 40 ✓
5. Se procesa C: ERROR "stock insuficiente"
6. **Resultado:** A y B quedaron con stock reducido SIN factura asociada

---

### BUG #3: IVA INCORRECTO (ALTO)

**Ubicación:** `serializers.py` línea 156

**Código Actual:**
```python
impuesto_total = (subtotal - descuento_total) * Decimal('0.12')  # IVA 12%
```

**Problema:** Paraguay usa IVA del **10%**, no 12%.

---

### BUG #4: VALIDACIÓN DE STOCK TARDÍA (MEDIO)

**Ubicación:** `serializers.py` líneas 114-116

**Problema:** La validación ocurre DENTRO del loop, después de que productos anteriores ya fueron modificados.

---

### BUG #5: IMPORTS REPETIDOS (BAJO)

**Ubicación:** `serializers.py` - múltiples ubicaciones

```python
def create(self, validated_data):
    from decimal import Decimal  # Import 1 (línea 107)
    subtotal = Decimal('0')
    
    for detalle in detalles_data:
        from decimal import Decimal  # Import 2 - REPETIDO (línea 109)
        from .models import Movimiento  # Import 3 - REPETIDO CADA ITERACIÓN (línea 132)
    
    from decimal import Decimal  # Import 4 - REPETIDO (línea 155)
```

---

## 🔍 ANÁLISIS DE CÁLCULOS MONETARIOS

### 1. DEFINICIÓN DE CAMPOS EN MODELOS

| Campo | Modelo | Tipo | max_digits | decimal_places |
|-------|--------|------|------------|----------------|
| `precio_costo` | Producto | DecimalField | 10 | 2 |
| `precio_unitario` | Producto | DecimalField | 10 | 2 |
| `impuesto` | Producto | DecimalField | 5 | 2 |
| `descuento` | Producto | DecimalField | 5 | 2 |
| `subtotal` | Factura | DecimalField | 10 | 2 |
| `descuento_total` | Factura | DecimalField | 10 | 2 |
| `impuesto_total` | Factura | DecimalField | 10 | 2 |
| `total` | Factura | DecimalField | 10 | 2 |
| `precio_unitario` | DetalleFactura | DecimalField | 10 | 2 |
| `subtotal` | DetalleFactura | DecimalField | 10 | 2 |
| `monto_total_compras` | Cliente | DecimalField | **15** | **0** |

### 2. INCONSISTENCIAS DETECTADAS

#### ⚠️ INCONSISTENCIA #1: Cliente.monto_total_compras
```python
# models.py línea 103-106
monto_total_compras = models.DecimalField(
    max_digits=15, 
    decimal_places=0,  # <-- SIN DECIMALES
    default=0
)
```
**Problema:** Este campo NO tiene decimales pero las facturas SÍ los tienen. Si una factura tiene total `150,500.50`, al sumar al cliente se guardará `150,500` (pérdida de centavos).

**Recomendación:** Cambiar a `decimal_places=2` para consistencia.

#### ⚠️ INCONSISTENCIA #2: Frontend vs Backend

**Frontend (`facturacion.component.ts` línea 302-310):**
```typescript
public calcularTotales(): void {
    this.subtotal = this.detalles.reduce((sum, detalle) => {
      const cantidad = parseFloat(detalle.cantidad?.toString()) || 0;
      const precio = parseFloat(detalle.precio_unitario?.toString()) || 0;
      return sum + (cantidad * precio);
    }, 0);
    
    const descuento = parseFloat(this.nuevaFactura.descuento_total?.toString()) || 0;
    this.total = this.subtotal - descuento;  // <-- SIN IVA!
}
```

**Backend (`serializers.py` línea 156-157):**
```python
impuesto_total = (subtotal - descuento_total) * Decimal('0.12')  # IVA 12%
total = subtotal - descuento_total + impuesto_total  # <-- CON IVA!
```

**Problema:** 
- Frontend muestra total SIN IVA al usuario
- Backend calcula total CON IVA
- El cliente ve un precio y paga otro

**Recomendación:** El frontend debería mostrar el IVA o el backend NO debería agregarlo. Debe haber consistencia.

#### ⚠️ INCONSISTENCIA #3: Conversión de Tipos

**Frontend envía strings con `.toFixed(2)`:**
```typescript
precio_unitario: parseFloat(detalle.precio_unitario?.toString()).toFixed(2), // String!
subtotal: (...).toFixed(2) // String!
```

**Backend espera y convierte:**
```python
precio_unitario = Decimal(str(precio_unitario))
cantidad_decimal = Decimal(str(cantidad))
```

**Problema:** `toFixed(2)` devuelve STRING, no número. Aunque funciona porque el backend hace `Decimal(str(...))`, es propenso a errores.

---

## 📐 FÓRMULAS DE CÁLCULO - VERIFICACIÓN

### Cálculo Actual del Backend:
```
subtotal_detalle = cantidad × precio_unitario
subtotal_factura = Σ(subtotal_detalle)
impuesto_total = (subtotal_factura - descuento_total) × 0.12
total = subtotal_factura - descuento_total + impuesto_total
```

### Verificación Matemática:
```
total = subtotal - descuento + (subtotal - descuento) × tasa_iva
total = (subtotal - descuento) × (1 + tasa_iva)
total = base_imponible × 1.12  (con IVA actual)
total = base_imponible × 1.10  (con IVA correcto de Paraguay)
```

**✓ La fórmula es matemáticamente correcta**, solo falta corregir la tasa.

---

## 📝 ESPECIFICACIÓN DE REFACTORIZACIÓN

### REQUERIMIENTO 1: Implementar Transaction Atomic

```python
from django.db import transaction

def create(self, validated_data):
    with transaction.atomic():
        # Todo el código aquí
        # Si hay CUALQUIER error, se revierte TODO automáticamente
```

### REQUERIMIENTO 2: Eliminar Resta Manual de Stock

**ELIMINAR estas líneas (117-118):**
```python
# Actualizar stock
producto.stock_disponible -= cantidad
producto.save()
```

**El signal en `signals.py` ya se encarga de esto cuando se crea el Movimiento.**

### REQUERIMIENTO 3: Pre-Validación de Stock

**ANTES de crear cualquier registro:**
```python
# Pre-validar TODO el stock antes de cualquier escritura
for detalle in detalles_data:
    producto = detalle['producto']
    cantidad = detalle['cantidad']
    if producto.stock_disponible < cantidad:
        raise serializers.ValidationError(
            f"Stock insuficiente para {producto.nombre}. "
            f"Disponible: {producto.stock_disponible}, Solicitado: {cantidad}"
        )
```

### REQUERIMIENTO 4: Corregir IVA

**Cambiar línea 156:**
```python
# ANTES:
impuesto_total = (subtotal - descuento_total) * Decimal('0.12')

# DESPUÉS:
impuesto_total = (subtotal - descuento_total) * Decimal('0.10')  # IVA 10% Paraguay
```

### REQUERIMIENTO 5: Organizar Imports

**Mover al inicio del método:**
```python
def create(self, validated_data):
    from django.db import transaction
    from decimal import Decimal
    from .models import Movimiento, DetalleFactura
    
    with transaction.atomic():
        # ... resto del código SIN imports repetidos
```

---

## 🎯 CÓDIGO REFACTORIZADO COMPLETO

```python
def create(self, validated_data):
    """
    Crea una factura con sus detalles, actualiza stock via signals.
    
    IMPORTANTE:
    - Todo dentro de transaction.atomic() para garantizar consistencia
    - NO modificar stock manualmente, el signal se encarga
    - Pre-validar stock ANTES de crear cualquier registro
    """
    from django.db import transaction
    from decimal import Decimal
    from .models import Movimiento, DetalleFactura
    
    with transaction.atomic():
        detalles_data = validated_data.pop('detalles')
        usuario = self.context['request'].user if 'request' in self.context else None
        
        # Limpiar campos calculados que no deben venir del frontend
        validated_data.pop('usuario', None)
        validated_data.pop('subtotal', None)
        validated_data.pop('total', None)
        validated_data.pop('impuesto_total', None)
        
        # ══════════════════════════════════════════════════════════
        # FASE 1: PRE-VALIDACIÓN DE STOCK (antes de cualquier escritura)
        # ══════════════════════════════════════════════════════════
        for detalle in detalles_data:
            producto = detalle['producto']
            cantidad = detalle['cantidad']
            
            # Refrescar el producto desde la DB para tener stock actualizado
            producto.refresh_from_db()
            
            if producto.stock_disponible < cantidad:
                raise serializers.ValidationError(
                    f"Stock insuficiente para '{producto.nombre}'. "
                    f"Disponible: {producto.stock_disponible}, Solicitado: {cantidad}"
                )
        
        # ══════════════════════════════════════════════════════════
        # FASE 2: CREAR FACTURA
        # ══════════════════════════════════════════════════════════
        factura = Factura.objects.create(
            usuario=usuario, 
            total=Decimal('0'),  # Temporal, se calcula después
            **validated_data
        )
        
        # ══════════════════════════════════════════════════════════
        # FASE 3: PROCESAR DETALLES
        # ══════════════════════════════════════════════════════════
        subtotal = Decimal('0')
        
        for detalle in detalles_data:
            producto = detalle['producto']
            cantidad = detalle['cantidad']
            precio_unitario = detalle.get('precio_unitario', producto.precio_unitario)
            
            # Asegurar tipos Decimal
            precio_unitario = Decimal(str(precio_unitario))
            cantidad_decimal = Decimal(str(cantidad))
            subtotal_detalle = cantidad_decimal * precio_unitario
            
            # Crear detalle de factura
            DetalleFactura.objects.create(
                factura=factura, 
                producto=producto, 
                cantidad=cantidad, 
                precio_unitario=precio_unitario, 
                subtotal=subtotal_detalle
            )
            
            # Crear movimiento de salida
            # ⚠️ NO modificar stock aquí - el signal lo hace automáticamente
            Movimiento.objects.create(
                producto=producto,
                tipo='salida',
                cantidad=cantidad,
                descripcion=f"Venta - Factura #{factura.numero_factura}",
                usuario=usuario
            )
            
            subtotal += subtotal_detalle
        
        # ══════════════════════════════════════════════════════════
        # FASE 4: CALCULAR TOTALES
        # ══════════════════════════════════════════════════════════
        descuento_total = Decimal(str(validated_data.get('descuento_total', 0)))
        
        # Base imponible = subtotal - descuentos
        base_imponible = subtotal - descuento_total
        
        # IVA 10% (Paraguay)
        TASA_IVA = Decimal('0.10')
        impuesto_total = base_imponible * TASA_IVA
        
        # Total final
        total = base_imponible + impuesto_total
        
        # Actualizar factura con totales calculados
        factura.subtotal = subtotal
        factura.impuesto_total = impuesto_total
        factura.total = total
        factura.save()
        
        return factura
```

---

## 🔄 CAMBIO EN RECEPCIÓN DE MERCADERÍA (MISMO PROBLEMA)

**Archivo:** `serializers.py` - `RecepcionMercaderiaSerializer.create()`

**Problema:** También hace suma manual + crea Movimiento (doble suma)

**Líneas a eliminar (318-320):**
```python
# Actualizar stock del producto
producto.stock_disponible += cantidad
producto.save()
```

---

## 🧪 PLAN DE PRUEBAS POST-REFACTORIZACIÓN

### Test 1: Verificar Resta Simple de Stock
```
Precondición: Producto A con stock = 100
Acción: Crear factura con 5 unidades de Producto A
Resultado Esperado: stock = 95 (no 90)
```

### Test 2: Verificar Rollback en Error
```
Precondición: Producto A (stock=10), Producto B (stock=2)
Acción: Crear factura con A=5, B=10 (B no tiene suficiente)
Resultado Esperado: 
  - Error "Stock insuficiente para Producto B"
  - Producto A stock = 10 (sin cambios)
  - Producto B stock = 2 (sin cambios)
  - No se crea factura
```

### Test 3: Verificar IVA Correcto
```
Precondición: Ninguna
Acción: Crear factura con subtotal = 100,000 Gs
Resultado Esperado:
  - impuesto_total = 10,000 Gs (10%)
  - total = 110,000 Gs
```

### Test 4: Verificar Recepción de Mercadería
```
Precondición: Producto A con stock = 50
Acción: Crear recepción de 20 unidades de Producto A
Resultado Esperado: stock = 70 (no 90)
```

---

## ⚙️ CONFIGURACIÓN RECOMENDADA (MEJORA FUTURA)

Crear constantes configurables para mayor flexibilidad:

```python
# settings.py o un archivo de configuración
FACTURACION_CONFIG = {
    'TASA_IVA': Decimal('0.10'),  # 10% Paraguay
    'MONEDA': 'PYG',
    'DECIMALES': 0,  # Guaraníes no tienen centavos
    'REDONDEO': 'ROUND_HALF_UP',
}
```

---

## 📊 RESUMEN EJECUTIVO

| Prioridad | Bug | Impacto | Acción |
|-----------|-----|---------|--------|
| 🔴 CRÍTICO | Doble resta stock | Pérdida datos | Eliminar líneas 117-118 |
| 🔴 CRÍTICO | Sin atomicidad | Datos inconsistentes | Agregar transaction.atomic() |
| 🟠 ALTO | IVA 12% vs 10% | Cálculos incorrectos | Cambiar a Decimal('0.10') |
| 🟡 MEDIO | Validación tardía | UX pobre | Pre-validar antes del loop |
| 🟢 BAJO | Imports repetidos | Performance | Mover al inicio |
| 🟡 MEDIO | Recepción doble suma | Pérdida datos | Eliminar suma manual |

---

**Documento preparado por:** Ingeniero de Software  
**Fecha:** Diciembre 2025  
**Versión:** 1.0  
**Estado:** Listo para implementación
