from typing import override
from django.db import models
from django.contrib.auth import get_user_model
from common.utils import get_positive_quantity
from common.models import BaseModel
from products.models import Product
from django.utils.translation import gettext_lazy as _

class Cart(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, verbose_name=_("User"))

    class Meta:
        verbose_name = _("Cart")
        verbose_name_plural = _("Carts")

    @override
    def __str__(self):
        return self.user.first_name

class CartItems(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, verbose_name=_("Cart"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_("Product"))
    quantity = models.IntegerField(validators=[get_positive_quantity], verbose_name=_("Quantity"))

    class Meta:
        verbose_name = _("Cart Item")
        verbose_name_plural = _("Cart Items")

    @override
    def __str__(self):
        return f'{self.product.name} - {self.quantity}'