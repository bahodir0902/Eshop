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
from django.utils.translation import gettext_lazy as _

class AvailableProducts(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_available=True)

class ApprovedProducts(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_approved=True)

class Category(models.Model):
    name = models.CharField(_("Name"), max_length=255)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, related_name='subcategories',
                                        null=True, blank=True, verbose_name=_("Parent Category"))

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")

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
        raise ValidationError(_('Image size can\'t exceed 4 MB.'))

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return str(os.path.join('product_images/', unique_filename))

class Inventory(BaseModel):
    name = models.CharField(_("Name"), max_length=255, null=True, blank=True, default=None)
    stock_count = models.IntegerField(_("Stock Count"))
    reserved_quantity = models.IntegerField(_("Reserved Quantity"), default=0, blank=True)
    warehouse_location = models.CharField(_("Warehouse Location"), max_length=255)

    class Meta:
        verbose_name = _("Inventory")
        verbose_name_plural = _("Inventories")

    @override
    def __str__(self):
        return f'{self.name} - {self.warehouse_location}'


class Product(BaseModel):
    name = models.CharField(_("Name"), max_length=255)
    price = models.DecimalField(_("Price"), decimal_places=2, max_digits=10, validators=[get_positive_quantity])
    is_available = models.BooleanField(_("Is Available"), default=True)
    short_description = models.CharField(
        _("Short Description"),
        max_length=255,
        null=True,
        blank=True,
        default='None description',
        help_text=_("Short catchy description for the product page.")
    )
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products', verbose_name=_("Shop"))
    slug = models.SlugField(_("Slug"), unique=True)
    full_description = models.TextField(
        _("Full Description"),
        null=True,
        blank=True,
        help_text=_("Detailed product description with marketing tone.")
    )
    key_features = models.TextField(
        _("Key Features"),
        null=True,
        blank=True,
        help_text=_('List of key features.')
    )
    specifications = models.TextField(
        _("Specifications"),
        null=True,
        blank=True,
        help_text=_("Key-value technical specs.")
    )
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True,
        verbose_name=_("Image")
    )
    is_discounted = models.BooleanField(_("Is Discounted"), default=False)
    is_featured = models.BooleanField(_("Is Featured"), default=False)
    is_approved = models.BooleanField(_("Is Approved"), default=False)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("Approved By"))
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='product_category', null=True, blank=True, verbose_name=_("Category"))
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='product', verbose_name=_("Inventory"))
    objects = models.Manager()
    available_products = AvailableProducts()
    approved_products = ApprovedProducts()

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")

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
