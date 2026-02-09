# Generated manually on 2026-02-08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0012_facturacompra_detallefacturacompra_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='producto',
            name='codigo',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]
