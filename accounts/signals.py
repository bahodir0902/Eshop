from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from accounts.utils import get_random_username
from django.contrib.auth.models import Group
from accounts.services import send_welcome_email

@receiver(post_save, sender=User)
def add_user_to_Users_group(sender, instance: User, created, **kwargs):
    if created:
        group, created = Group.objects.get_or_create(name='Users')
        instance.groups.add(group)

        send_welcome_email(instance)



