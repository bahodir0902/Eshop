from datetime import timedelta
from typing import override
from django.contrib.auth.models import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from common.models import BaseModel
from django.utils import timezone
from accounts.utils import get_random_username


class CustomUserManager(BaseUserManager):
    """User manager where email is the unique identifier"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with the given email and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    phone_number = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    is_verified_email = models.BooleanField(default=False)
    username = models.CharField(max_length=255, unique=True, default=get_random_username)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @override
    def __str__(self):
        return self.email


class Address(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=50)
    is_primary = models.BooleanField(default=True)

def default_expire_date():
    return timezone.now() + timedelta(minutes=1)

class CodePassword(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=10)
    expire_date = models.DateTimeField(default=default_expire_date)
    created_at = models.DateTimeField(auto_now_add=True)

    @override
    def save(self, *args, **kwargs):
        CodePassword.objects.filter(user=self.user).delete()
        super().save(*args, **kwargs)

    @override
    def __str__(self):
        return f"Code: {self.code} for {self.user.email} (Expires: {self.expire_date})"

class CodeEmail(models.Model):
    code = models.CharField(max_length=10)
    email = models.EmailField(max_length=200)
    expire_date = models.DateTimeField(default=default_expire_date)

    @override
    def save(self, *args, **kwargs):
        CodeEmail.objects.filter(email=self.email).delete()
        super().save(*args, **kwargs)

    @override
    def __str__(self):
        return f"Code: {self.code} for {self.email} (Expires: {self.expire_date})"