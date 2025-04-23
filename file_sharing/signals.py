from django.db.models.signals import post_save
from django.dispatch import receiver
from file_sharing.models import FileUpload
from file_sharing.service import send_email_for_file_upload


@receiver(post_save, sender=FileUpload)
def notify_file_upload(sender, instance: FileUpload, created, **kwargs):
    if created and instance.user.email:
        send_email_for_file_upload(instance)
