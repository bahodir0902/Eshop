from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from carts.models import CartItems

channel_layer = get_channel_layer()

@receiver([post_save, post_delete], sender=CartItems)
def cart_item_changed(sender, instance, **kwargs):
    """Send update when cart items change"""
    user_id = instance.cart.user.id
    group_name = f'user_counts_{user_id}'

    # Calculate new counts
    cart_count = CartItems.objects.filter(cart=instance.cart).count()

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'counts_update',
            'data': {
                'cart_count': cart_count,
            }
        }
    )

