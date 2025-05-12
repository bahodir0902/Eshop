from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notifications

channel_layer = get_channel_layer()


@receiver(post_save, sender=Notifications)
def notification_created(sender, instance, created, **kwargs):
    """Send update when notification is created"""
    if created:
        user_id = instance.to_user.id
        group_name = f'user_counts_{user_id}'

        # Calculate new count
        notifications_count = Notifications.objects.filter(
            to_user=instance.to_user,
            is_read=False
        ).count()

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'counts_update',
                'data': {
                    'notifications_count': notifications_count,
                }
            }
        )