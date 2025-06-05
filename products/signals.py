# signals.py - Option 2: Use pre_save to avoid recursion
from django.db.models.signals import pre_save
from django.dispatch import receiver
from products.models import Product

@receiver(pre_save, sender=Product)
def update_product_availability_on_save(sender, instance, **kwargs):
    """Handle inventory updates for pre_save signal"""
    # Update availability before saving - no recursion issue
    instance.is_available = instance.stock_count > 0