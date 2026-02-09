# Migración para optimizar índices y mejorar performance
# Creada manualmente el 2025-12-08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0009_remove_factura_cliente_factura_descuento_total_and_more'),
    ]

    operations = [
        # Índice compuesto para búsquedas frecuentes: productos activos por categoría
        migrations.AddIndex(
            model_name='producto',
            index=models.Index(
                fields=['categoria_id', 'activo'],
                name='idx_cat_activo'
            ),
        ),
        # Índice para detectar productos con stock bajo (query muy común)
        migrations.AddIndex(
            model_name='producto',
            index=models.Index(
                fields=['activo', 'stock_disponible', 'stock_minimo'],
                name='idx_stock_bajo'
            ),
        ),
        # Índice en fecha de movimientos para reportes históricos
        migrations.AddIndex(
            model_name='movimiento',
            index=models.Index(
                fields=['-fecha', 'tipo'],
                name='idx_mov_fecha'
            ),
        ),
        # Índice para búsquedas por nombre (full-text search en español)
        migrations.RunSQL(
            sql='CREATE INDEX idx_producto_nombre_gin ON inventario_producto USING gin(to_tsvector(\'spanish\', nombre));',
            reverse_sql='DROP INDEX IF EXISTS idx_producto_nombre_gin;'
        ),
    ]

