from django.db.models.signals import post_save
from django.dispatch import receiver
from payments.models import Payment
from payments.service import send_confirmation_email

@receiver(post_save, sender=Payment)
def send_confirmation_letter(sender, instance, created, **kwargs):
    pass