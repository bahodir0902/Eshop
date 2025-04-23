from datetime import timedelta
from typing import override
from django.contrib.auth.models import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from common.models import BaseModel
from django.utils import timezone
from accounts.utils import get_random_username
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """User manager where email is the unique identifier"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field must be set"))
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
    phone_number = models.CharField(_("Phone Number"), max_length=100, blank=True, null=True)
    email = models.EmailField(_("Email"), unique=True)
    is_verified_email = models.BooleanField(_("Email Verified"), default=False)
    username = models.CharField(_("Username"), max_length=255, unique=True, default=get_random_username)
    google_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    @override
    def __str__(self):
        return self.email


class Address(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_("User"))
    address_line_1 = models.CharField(_("Address Line 1"), max_length=255)
    address_line_2 = models.CharField(_("Address Line 2"), max_length=255, null=True, blank=True)
    city = models.CharField(_("City"), max_length=100)
    state_or_province = models.CharField(_("State/Province"), max_length=100, default="City")
    country = models.CharField(_("Country"), max_length=100)
    postal_code = models.CharField(_("Postal Code"), max_length=50)
    is_primary = models.BooleanField(_("Primary Address"), default=True)

    class Meta:
        verbose_name = _("Address")
        verbose_name_plural = _("Addresses")

    @override
    def __str__(self):
        return f'{self.user.first_name} - {self.address_line_1} - {self.address_line_2} - {self.city} - {self.country}'


def default_expire_date():
    return timezone.now() + timedelta(minutes=1)

class CodePassword(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_("User"))
    code = models.CharField(_("Code"), max_length=10)
    expire_date = models.DateTimeField(_("Expiration Date"), default=default_expire_date)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)

    class Meta:
        verbose_name = _("Password Code")
        verbose_name_plural = _("Password Codes")

    @override
    def save(self, *args, **kwargs):
        CodePassword.objects.filter(user=self.user).delete()
        super().save(*args, **kwargs)

    @override
    def __str__(self):
        return f"Code: {self.code} for {self.user.email} (Expires: {self.expire_date})"

class CodeEmail(models.Model):
    code = models.CharField(_("Code"), max_length=10)
    email = models.EmailField(_("Email"), max_length=200)
    expire_date = models.DateTimeField(_("Expiration Date"), default=default_expire_date)

    class Meta:
        verbose_name = _("Email Code")
        verbose_name_plural = _("Email Codes")

    @override
    def save(self, *args, **kwargs):
        CodeEmail.objects.filter(email=self.email).delete()
        super().save(*args, **kwargs)

    @override
    def __str__(self):
        return f"Code: {self.code} for {self.email} (Expires: {self.expire_date})"