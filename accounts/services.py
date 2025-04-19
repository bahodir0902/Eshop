from django.core.mail import EmailMultiAlternatives
from accounts.models import User, CodePassword
from accounts.utils import generate_random_code
from decouple import config
from threading import Thread

def send_email_verification(user):
    code = str(generate_random_code())
    CodePassword.objects.create(email=user.email, code=code)
    subject = "Password Reset Verification"
    from_email = config('EMAIL_HOST_USER')
    to = [user.email]
    text_content = f"""
        Hello {user.first_name}!
        Enter this code to in that form to reset your password.
        {code}
    """

    html_content = f"""
        <h1>Hello {user.first_name}!</h1>
        <div>
            You have requested a password reset. Please Enter this code below to reset your password:
            <p style="font-size: large; font-color: blue;>{code}</p>
        </div>
    """

    email = EmailMultiAlternatives(subject, text_content, from_email, to)
    email.attach_alternative(html_content, 'text/html')

    thread1 = Thread(target=email.send)
    thread1.start()

def send_welcome_email(user):
    subject = f"Congratulations with successful registration!"
    from_email = config('EMAIL_HOST_USER')
    to = [user.email]
    text_content = f"""
            Hello Dear {user.first_name}!
            XULLAS XUSH KELIBSIZ
        """
    email = EmailMultiAlternatives(subject, text_content, from_email, to)
    thread1 = Thread(target=email.send)
    thread1.start()
