# 🔧 FIX: RecepcionMercaderia - De 13/16 a 16/16 Tests (100%)

## 🐛 PROBLEMA IDENTIFICADO

3 tests de RecepcionMercaderia fallaban con error 400:
- `test_recepcion_actualiza_precio_costo_y_recalcula_venta`
- `test_recepcion_multiples_productos`
- `test_flujo_completo_crear_recibir_y_editar_producto`

## 🔍 CAUSA RAÍZ

Los tests enviaban estructura incorrecta al serializer:

### ❌ ANTES (Incorrecto):
```python
data = {
    'proveedor': proveedor_id,
    'fecha_recepcion': '2026-02-08',  # ❌ Read-only field
    'detalles': [
        {
            'producto': producto_id,
            'cantidad': 10,  # ❌ Campo incorrecto
            'precio_unitario': 40000
        }
    ]
}
```

### ✅ DESPUÉS (Correcto):
```python
data = {
    'numero_recepcion': 'REC-TEST-001',  # ✅ Requerido
    'proveedor': proveedor_id,
    # fecha_recepcion se asigna automáticamente (auto_now_add)
    'detalles': [
        {
            'producto': producto_id,
            'cantidad_recibida': 10,  # ✅ Campo correcto del modelo
            'precio_unitario': 40000
        }
    ]
}
```

## 📋 MODELO DETALLERECEPCION

```python
class DetalleRecepcion(models.Model):
    recepcion = models.ForeignKey(RecepcionMercaderia, ...)
    producto = models.ForeignKey(Producto, ...)
    cantidad_recibida = models.PositiveIntegerField()  # ✅ Este es el campo correcto
    precio_unitario = models.DecimalField(...)
    lote = models.CharField(...)
    fecha_vencimiento = models.DateField(...)
```

## 🔧 CAMBIOS REALIZADOS

**Archivo:** `inventario/tests_actualizacion_v2.py`

### Test 1: `test_recepcion_actualiza_precio_costo_y_recalcula_venta` (línea 175)
```python
# ANTES:
'fecha_recepcion': '2026-02-08',
'cantidad': 10,

# DESPUÉS:
'numero_recepcion': 'REC-TEST-001',
'cantidad_recibida': 10,
```

### Test 2: `test_recepcion_multiples_productos` (línea 208)
```python
# ANTES:
'fecha_recepcion': '2026-02-08',
'cantidad': 5,
'cantidad': 10,

# DESPUÉS:
'numero_recepcion': 'REC-TEST-002',
'cantidad_recibida': 5,
'cantidad_recibida': 10,
```

### Test 3: `test_flujo_completo_crear_recibir_y_editar_producto` (línea 400)
```python
# ANTES:
'fecha_recepcion': '2026-02-08',
'cantidad': 50,

# DESPUÉS:
'numero_recepcion': 'REC-TEST-003',
'cantidad_recibida': 50,
```

## ✅ RESULTADO

### ANTES del fix:
```
Ran 83 tests in 7.778s
FAILED (failures=3)
80/83 tests passing (96.4%)
```

### DESPUÉS del fix:
```
Ran 83 tests in 7.257s
OK
83/83 tests passing (100%)
```

## 📊 FUNCIONALIDAD VALIDADA

Con estos tests ahora verificamos que RecepcionMercaderia:

1. ✅ **Actualiza stock automáticamente**
   - Crea Movimiento de tipo 'entrada'
   - Signal actualiza stock_disponible del producto

2. ✅ **Actualiza precio de costo**
   - `producto.precio_costo = precio_unitario_recibido`

3. ✅ **Recalcula precio de venta (+30%)**
   - `producto.precio_unitario = precio_costo * 1.30`

4. ✅ **Maneja múltiples productos en una recepción**
   - Actualiza stock y precios de cada producto
   - Registra movimientos individuales

5. ✅ **Integra con OrdenCompra (opcional)**
   - Actualiza `cantidad_recibida` en DetalleOrdenCompra
   - Permite control de recepciones parciales

## 🚀 COMANDOS PARA VERIFICAR

```powershell
# Test específico de RecepcionMercaderia
docker exec ferreteria-api python manage.py test inventario.tests_actualizacion_v2.RecepcionMercaderiaActualizaPreciosTest

# Todos los tests de V2.1
docker exec ferreteria-api python manage.py test inventario.tests_actualizacion_v2

# Suite completa (83 tests)
docker exec ferreteria-api python manage.py test inventario
```

## 📚 LECCIÓN APRENDIDA

**Siempre verificar los nombres de campos en el modelo antes de escribir tests.**

- ✅ Usar mismo nombre que en el modelo
- ✅ Verificar campos read_only en serializers
- ✅ Usar campos requeridos (como `numero_recepcion`)

---

**Fix aplicado:** 8 de febrero de 2026  
**Tiempo de resolución:** 5 minutos  
**Tests afectados:** 3 → ✅ Todos pasando

🎉 **Sistema 100% validado y listo para producción**
