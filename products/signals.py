# Fix for signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from products.models import Product, Inventory

@receiver(post_save, sender=Inventory)
def update_product_availability_on_save(sender, instance, created, **kwargs):
    """Handle inventory updates for post_save signal"""
    products = instance.product.all() if hasattr(instance, 'product') else []
    for product in products:
        product.is_available = instance.stock_count > 0
        product.save(update_fields=['is_available'])

@receiver(post_delete, sender=Inventory)
def update_product_availability_on_delete(sender, instance, **kwargs):
    """Handle inventory updates for post_delete signal"""
    products = instance.product.all() if hasattr(instance, 'product') else []
    for product in products:
        product.is_available = False
        product.save(update_fields=['is_available'])