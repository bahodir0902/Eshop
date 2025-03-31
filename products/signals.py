from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from products.models import Product, Inventory


@receiver(post_save, sender=Inventory)
@receiver(post_delete, sender=Inventory)
def set_is_available_to_false(sender, instance: Inventory, created, **kwargs):
    product = instance.product
    product.is_available = instance.stock_count > 0

@receiver(post_save, sender=Product)
def set_moderation_status(sender, instance: Product, created, **kwargs):
    pass


