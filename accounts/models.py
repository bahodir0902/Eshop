from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    email = models.EmailField(_('email'), unique=True)
    google_id = models.CharField(max_length=200, null=True, blank=True)
    profile_photo = models.ImageField(null=True, blank=True)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'User with {self.first_name} - {self.last_name}'

def default_expire_date():
    return timezone.now() + timedelta(minutes=1)

class CodePassword(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=20)
    expire_date = models.DateTimeField(default=default_expire_date)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        CodePassword.objects.filter(email=self.email).delete()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Code: {self.code} for {self.email}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    image = models.ImageField(_("Image"), upload_to='profile_images', null=True, blank=True)
    bio = models.TextField(_('bio'), null=True, blank=True)
    phone = models.CharField(_('phone number'), max_length=50, null=True, blank=True, unique=True)

    def __str__(self):
        return f'Profile for {self.user.first_name} - {self.user.last_name}'