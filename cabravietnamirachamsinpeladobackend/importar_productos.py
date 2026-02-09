import os
import django
import pandas as pd
from pathlib import Path

# Cargar variables de entorno desde .env (si existe)
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key, value)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_ferreteria.settings')
django.setup()

from inventario.models import Categoria, Producto

# Cambia el nombre del archivo por el tuyo
df = pd.read_excel('Inventario_Repuestos.xlsx')

for _, row in df.iterrows():
    # Crea o busca la categoría
    categoria, _ = Categoria.objects.get_or_create(nombre=row['Categoría'])

    Producto.objects.update_or_create(
        codigo=row['Código'],
        defaults={
            'nombre': row['Nombre del repuesto'],
            'modelo_compatible': row.get('Modelo compatible', ''),
            'descripcion': row.get('Descripción', ''),
            'categoria': categoria,
            'marca': row.get('Marca', ''),
            'unidad_medida': '',  # Si tienes este campo en el Excel, cámbialo aquí
            'stock_disponible': row.get('Stock actual', 0),
            'stock_minimo': row.get('Stock mínimo', 0),
            'precio_costo': row.get('Precio de costo', 0),
            'precio_unitario': row.get('Precio de venta', 0),
            'proveedor_texto': row.get('Proveedor', ''),  # Cambiado de 'proveedor' a 'proveedor_texto'
            'fecha_actualizacion': row.get('Fecha de ingreso', None),
            'ubicacion_fisica': row.get('Ubicación física', ''),
        }
    )

print("¡Importación completada!")