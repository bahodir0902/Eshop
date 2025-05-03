from django.db.models.signals import post_save
from django.dispatch import receiver
from payments.models import Payment
from notifications.models import Notifications

@receiver(post_save, sender=Payment)
def send_successful_payment_notification(sender, instance: Payment, created, **kwargs):
    if created:
        if instance.status == 'paid':
            Notifications.objects.create(
                to_user=instance.order.user,
                title="Congratulations with successful payment",
                message=f"Your payment for Order #{instance.order.pk} has been successfully processed. Thank you for your purchase!"
            )

