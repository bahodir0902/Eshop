from django.dispatch import receiver
from django.db.models.signals import post_save
from accounts.models import User
from accounts.utils import get_random_username

@receiver(post_save, sender=User)
def set_random_username(sender, instance, created, **kwargs):
    if created:
        instance.username = get_random_username()
        instance.save()