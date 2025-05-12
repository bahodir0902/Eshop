from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from carts.models import CartItems
from favourites.models import FavouriteItem


channel_layer = get_channel_layer()



@receiver([post_save, post_delete], sender=FavouriteItem)
def favourite_item_changed(sender, instance, **kwargs):
    """Send update when favourite items change"""
    user_id = instance.favourite.user.id
    group_name = f'user_counts_{user_id}'

    # Calculate new counts
    wishlist_count = FavouriteItem.objects.filter(favourite=instance.favourite).count()

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'counts_update',
            'data': {
                'wishlist_count': wishlist_count,
            }
        }
    )