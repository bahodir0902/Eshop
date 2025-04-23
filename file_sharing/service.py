from django.core.mail import send_mail
from file_sharing.models import FileUpload
from decouple import config
from threading import Thread

def send_email_for_file_upload(instance: FileUpload):
    subject = f"New file uploaded: {instance.name}"
    message = f"""
    Hello {instance.user.first_name},
    Your file '{instance.name} has been successfully uploaded'
    
    XULLAS XIZMATIMIZDAN FOYDALANGANIZ UCHUN RAHMAT!!!
    """

    from_email = config('EMAIL_HOST_USER')
    recipient_list = [instance.user.email]

    thread1 = Thread(target=send_mail, args=(subject, message, from_email, recipient_list))
    thread1.start()