from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=200, null=True, blank=True)
    profile_photo = models.ImageField(null=True, blank=True)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

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


