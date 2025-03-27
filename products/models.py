from django.db import models
from common.models import BaseModel
from shops.models import Shop
from django.contrib.auth import get_user_model
from typing import override
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
import os
import time
import uuid
from common.utils import get_positive_quantity

class AvailableProducts(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_available=True)

class ApprovedProducts(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_approved=True)

class Category(models.Model):
    name = models.CharField(max_length=255)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, related_name='subcategories', null=True, blank=True)

    @override
    def __str__(self):
        return self.name

def validate_image_size(image):
    max_size = 4 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError('Image size can\'t exceed 4 MB.')

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return os.path.join('product_images/', unique_filename)

class Product(BaseModel):
    name = models.CharField(max_length=255)
    price = models.DecimalField(decimal_places=2, max_digits=10, validators=[get_positive_quantity])
    is_available = models.BooleanField(default=True)
    description = models.TextField()
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True
    )
    slug = models.SlugField(unique=True)
    is_discounted = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='product_category', null=True, blank=True)

    objects = models.Manager()
    available_products = AvailableProducts()
    approved_products = ApprovedProducts()

    @override
    def __str__(self):
        return f'{self.name} - {self.price}'


class Inventory(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_products')
    stock_count = models.IntegerField()
    reserved_quantity = models.IntegerField(default=0, blank=True)
    warehouse_location = models.CharField(max_length=255)




