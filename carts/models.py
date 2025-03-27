from typing import override

from django.db import models
from django.contrib.auth import get_user_model
from common.utils import get_positive_quantity
from common.models import BaseModel
from products.models import Product




class Cart(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    @override
    def __str__(self):
        return self.user.first_name


class CartItems(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(validators=[get_positive_quantity])

    @override
    def __str__(self):
        return f'{self.product.name} - {self.quantity}'

