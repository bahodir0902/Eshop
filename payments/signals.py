from django.db.models.signals import post_save
from django.dispatch import receiver
from payments.models import Payment
from payments.service import send_confirmation_email
from orders.models import Order, OrderDetails
# @receiver(post_save, sender=Payment)
# def send_confirmation_letter(sender, instance, created, **kwargs):
#     pass
#

# @receiver(post_save, sender=Payment)
# def update_product_availability(sender, instance: Payment, created, **kwargs):
#     if created:
#         order = instance.order
#         order_items = OrderDetails.objects.filter(order=order)
#         for item in order_items:
#             if item.product.inventory.stock_count == 0:
#                 product = item.product
#                 product.is_available = False
#                 product.save()
