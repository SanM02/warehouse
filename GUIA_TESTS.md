# 📚 GUÍA DE TESTS - Cómo Usar y Agregar Tests

## 🚀 EJECUTAR TESTS

### Opción 1: Script Automatizado (RECOMENDADO)
```powershell
.\scripts\ejecutar-tests.ps1
```

### Opción 2: Comandos Manuales

**Todos los tests (83 tests):**
```powershell
docker exec ferreteria-api python manage.py test inventario --verbosity=2
```

**Solo tests completos (45 tests):**
```powershell
docker exec ferreteria-api python manage.py test inventario.tests_completo
```

**Solo tests de facturas de compra (22 tests):**
```powershell
docker exec ferreteria-api python manage.py test inventario.tests_factura_compra
```

**Solo tests V2.1 (16 tests):**
```powershell
docker exec ferreteria-api python manage.py test inventario.tests_actualizacion_v2
```

**Un test específico:**
```powershell
docker exec ferreteria-api python manage.py test inventario.tests_completo.ProductoModelCompletoTest.test_producto_campos_completos
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
cabravietnamirachamsinpeladobackend/inventario/
├── tests.py                      # Template vacío
├── tests_completo.py             # 45 tests - TODOS los modelos
├── tests_factura_compra.py       # 22 tests - Facturas de compra
└── tests_actualizacion_v2.py     # 16 tests - Features V2.1
```

---

## ✍️ CÓMO AGREGAR NUEVOS TESTS

### Estructura Básica de un Test

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from inventario.models import TuModelo

class TuModeloTest(TestCase):
    """Tests para el modelo TuModelo"""
    
    def setUp(self):
        """Se ejecuta antes de cada test"""
        # Crear datos necesarios
        self.dato = TuModelo.objects.create(
            campo1="valor1",
            campo2=123
        )
    
    def tearDown(self):
        """Se ejecuta después de cada test (opcional)"""
        pass
    
    def test_crear_modelo(self):
        """Descripción del test"""
        # Arrange (preparar)
        valor_esperado = "test"
        
        # Act (ejecutar)
        resultado = TuModelo.objects.create(campo1=valor_esperado)
        
        # Assert (verificar)
        self.assertEqual(resultado.campo1, valor_esperado)
        self.assertIsNotNone(resultado.id)
```

### Test de API

```python
class TuAPITest(TestCase):
    """Tests para el API de TuModelo"""
    
    def setUp(self):
        # Crear usuario autenticado
        self.user = User.objects.create_user(
            username='testuser', 
            password='12345'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_listar_modelos(self):
        """GET /api/tumodelo/ lista modelos"""
        response = self.client.get('/api/tumodelo/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_crear_modelo_via_api(self):
        """POST /api/tumodelo/ crea modelo"""
        data = {
            'campo1': 'valor1',
            'campo2': 123
        }
        
        response = self.client.post('/api/tumodelo/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
```

---

## 🎯 TIPOS DE TESTS

### 1. **Tests de Modelo** (CRUD básico)

```python
def test_crear_modelo(self):
    """Crear instancia del modelo"""
    modelo = MiModelo.objects.create(nombre="Test")
    self.assertEqual(modelo.nombre, "Test")

def test_str_representation(self):
    """Método __str__ devuelve el formato correcto"""
    modelo = MiModelo.objects.create(nombre="Test")
    self.assertEqual(str(modelo), "Test")

def test_unique_constraint(self):
    """Campo único no permite duplicados"""
    MiModelo.objects.create(codigo="ABC")
    with self.assertRaises(IntegrityError):
        MiModelo.objects.create(codigo="ABC")
```

### 2. **Tests de Relaciones**

```python
def test_relacion_foreign_key(self):
    """ForeignKey funciona correctamente"""
    padre = Padre.objects.create(nombre="Padre")
    hijo = Hijo.objects.create(nombre="Hijo", padre=padre)
    
    self.assertEqual(hijo.padre, padre)
    self.assertEqual(padre.hijos.count(), 1)

def test_cascade_delete(self):
    """Al eliminar padre, hijos se eliminan (CASCADE)"""
    padre = Padre.objects.create(nombre="Padre")
    hijo = Hijo.objects.create(nombre="Hijo", padre=padre)
    
    padre.delete()
    self.assertFalse(Hijo.objects.filter(id=hijo.id).exists())
```

### 3. **Tests de Validaciones**

```python
def test_campo_requerido(self):
    """Campo requerido no puede ser NULL"""
    with self.assertRaises((ValueError, ValidationError)):
        MiModelo.objects.create()  # Sin campo requerido

def test_valor_positivo(self):
    """Campo no puede ser negativo"""
    with self.assertRaises((ValueError, IntegrityError)):
        MiModelo.objects.create(cantidad=-10)
```

### 4. **Tests de Cálculos**

```python
def test_calculo_total(self):
    """Total se calcula correctamente"""
    item = Item.objects.create(
        cantidad=5,
        precio_unitario=Decimal('10000')
    )
    
    self.assertEqual(item.subtotal, Decimal('50000'))

def test_porcentaje_automatico(self):
    """Descuento se aplica automáticamente"""
    producto = Producto.objects.create(
        precio_costo=Decimal('10000')
    )
    
    # Precio de venta debe ser +30%
    esperado = Decimal('13000')
    self.assertEqual(producto.precio_unitario, esperado)
```

### 5. **Tests de APIs**

```python
def test_autenticacion_requerida(self):
    """Endpoint requiere autenticación"""
    client = APIClient()  # Sin autenticar
    response = client.get('/api/privado/')
    
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

def test_paginacion(self):
    """Lista está paginada"""
    # Crear 30 items
    for i in range(30):
        Item.objects.create(nombre=f"Item {i}")
    
    response = self.client.get('/api/items/')
    
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn('results', response.data)
    self.assertIn('count', response.data)
```

---

## 🔧 ASSERTIONS COMUNES

### Igualdad
```python
self.assertEqual(a, b)              # a == b
self.assertNotEqual(a, b)           # a != b
self.assertTrue(x)                  # x es True
self.assertFalse(x)                 # x es False
self.assertIsNone(x)                # x es None
self.assertIsNotNone(x)             # x no es None
```

### Contenido
```python
self.assertIn(item, lista)          # item in lista
self.assertNotIn(item, lista)       # item not in lista
self.assertContains(response, text) # text en response.content
```

### Tipos
```python
self.assertIsInstance(obj, Clase)   # isinstance(obj, Clase)
self.assertIsNotInstance(obj, Clase)
```

### Excepciones
```python
with self.assertRaises(Exception):
    funcion_que_falla()
```

### Números
```python
self.assertGreater(a, b)            # a > b
self.assertGreaterEqual(a, b)       # a >= b
self.assertLess(a, b)               # a < b
self.assertLessEqual(a, b)          # a <= b
self.assertAlmostEqual(a, b)        # a ≈ b (decimales)
```

---

## 📋 CHECKLIST PARA NUEVOS FEATURES

Cuando agregues una nueva funcionalidad, asegurate de testear:

- [ ] **Crear** (POST)
  - [ ] Con datos válidos
  - [ ] Con datos inválidos
  - [ ] Con campos opcionales
  - [ ] Sin campos opcionales

- [ ] **Leer** (GET)
  - [ ] Listar todos
  - [ ] Obtener uno por ID
  - [ ] Filtros
  - [ ] Paginación

- [ ] **Actualizar** (PUT/PATCH)
  - [ ] Actualización completa
  - [ ] Actualización parcial
  - [ ] Validaciones

- [ ] **Eliminar** (DELETE)
  - [ ] Eliminación simple
  - [ ] Cascade deletes
  - [ ] Restricciones

- [ ] **Validaciones**
  - [ ] Campos únicos
  - [ ] Campos requeridos
  - [ ] Rangos de valores
  - [ ] Tipos de datos

- [ ] **Relaciones**
  - [ ] ForeignKey
  - [ ] ManyToMany
  - [ ] Reverse relations

- [ ] **Lógica de Negocio**
  - [ ] Cálculos automáticos
  - [ ] Estados y transiciones
  - [ ] Permisos

---

## 🐛 DEBUGGING TESTS

### Ver detalles de errores
```powershell
docker exec ferreteria-api python manage.py test inventario --verbosity=2
```

### Ver output de print()
```python
def test_con_debug(self):
    resultado = funcion()
    print(f"DEBUG: resultado = {resultado}")  # Se verá en consola
    self.assertEqual(resultado, esperado)
```

### Mantener la base de datos de tests
```powershell
docker exec ferreteria-api python manage.py test inventario --keepdb
```
Útil para inspeccionar datos después de un test fallido.

### Ejecutar solo tests fallidos
```powershell
docker exec ferreteria-api python manage.py test inventario --failfast
```
Detiene en el primer error.

---

## 📊 COVERAGE (Opcional)

Para ver cobertura de código con tests:

1. Instalar coverage:
```bash
pip install coverage
```

2. Ejecutar tests con coverage:
```bash
coverage run --source='.' manage.py test inventario
coverage report
coverage html  # Genera reporte HTML
```

---

## 🎯 MEJORES PRÁCTICAS

1. **Un test, una validación**
   - Cada test debe validar UNA cosa específica
   - Si falla, debe ser obvio qué está roto

2. **Nombres descriptivos**
   ```python
   # ❌ Mal
   def test_1(self):
   
   # ✅ Bien
   def test_crear_producto_calcula_precio_venta_automatico(self):
   ```

3. **Arrange-Act-Assert**
   ```python
   def test_ejemplo(self):
       # Arrange: preparar datos
       dato = crear_dato()
       
       # Act: ejecutar acción
       resultado = funcionar_con(dato)
       
       # Assert: verificar resultado
       self.assertEqual(resultado, esperado)
   ```

4. **Tests independientes**
   - Cada test debe poder correr solo
   - No depender del orden de ejecución
   - Usar setUp() para preparar datos

5. **Tests rápidos**
   - Evitar sleeps
   - Usar mocks para servicios externos
   - No ejecutar tareas pesadas

6. **Docstrings claros**
   ```python
   def test_producto_sin_codigo_es_valido(self):
       """
       Verifica que un producto puede crearse sin código,
       ya que el campo es nullable desde la migración 0013.
       """
   ```

---

## 🔄 WORKFLOW RECOMENDADO

1. **Antes de codificar**: Escribí el test (TDD)
2. **Durante el desarrollo**: Ejecutá tests frecuentemente
3. **Antes de commit**: Todos los tests deben pasar
4. **Antes de deployment**: Ejecutá suite completa

```bash
# Workflow típico
git checkout -b feature/nueva-funcionalidad
# ... escribir tests ...
docker exec ferreteria-api python manage.py test inventario.tests_completo.NuevoTest
# ... implementar feature ...
docker exec ferreteria-api python manage.py test inventario
git add .
git commit -m "feat: nueva funcionalidad con tests"
```

---

## 📚 RECURSOS

- [Django Testing Documentation](https://docs.djangoproject.com/en/5.0/topics/testing/)
- [DRF Testing Guide](https://www.django-rest-framework.org/api-guide/testing/)
- [Python unittest](https://docs.python.org/3/library/unittest.html)

---

**¡A testear con confianza!** 🚀
