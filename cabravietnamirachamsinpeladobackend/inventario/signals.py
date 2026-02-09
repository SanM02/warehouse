from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Movimiento, Producto

@receiver(post_save, sender=Movimiento)
def actualizar_stock(sender, instance, created, **kwargs):
    if created:
        producto = instance.producto
        if instance.tipo == 'entrada':
            producto.stock_disponible += instance.cantidad
        elif instance.tipo == 'salida':
            producto.stock_disponible -= instance.cantidad
        producto.save()