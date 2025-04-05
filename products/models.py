from django.db import models
from common.models import BaseModel
from shops.models import Shop
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

    def get_all_subcategories(self):
        subcategories = list(self.subcategories.all())
        for subcategory in subcategories:
            subcategories.extend(subcategory.get_all_subcategories())
        return subcategories

def validate_image_size(image):
    max_size = 4 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError('Image size can\'t exceed 4 MB.')

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return str(os.path.join('product_images/', unique_filename))

class Inventory(BaseModel):
    name = models.CharField(max_length=255, null=True, blank=True, default=None)
    stock_count = models.IntegerField()
    reserved_quantity = models.IntegerField(default=0, blank=True)
    warehouse_location = models.CharField(max_length=255)

    @override
    def __str__(self):
        return f'{self.name} - {self.warehouse_location}'


class Product(BaseModel):
    name = models.CharField(max_length=255)
    price = models.DecimalField(decimal_places=2, max_digits=10, validators=[get_positive_quantity])
    is_available = models.BooleanField(default=True)
    short_description = models.CharField(max_length=255, null=True, blank=True, default='None description', help_text="Short catchy description for the product page.")
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    slug = models.SlugField(unique=True)
    full_description = models.TextField(null=True, blank=True, help_text="Detailed product description with marketing tone.")
    key_features = models.TextField(null=True, blank=True, help_text='List of key features.')
    specifications = models.TextField(null=True, blank=True, help_text="Key-value technical specs.")
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True
    )
    is_discounted = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='product_category', null=True, blank=True)
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='product')
    objects = models.Manager()
    available_products = AvailableProducts()
    approved_products = ApprovedProducts()


    @override
    def __str__(self):
        return f'{self.name} - {self.price}'

# class ProductImage(models.Model):
#     product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
#     image = models.ImageField(
#         upload_to=unique_image_path,
#         validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
#         null=True,
#         blank=True
#     )
#
#     @override
#     def __str__(self):
#         return f'Image for {self.product.name}'




