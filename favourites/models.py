from django.db import models
from common.models import BaseModel
from accounts.models import User
from products.models import Product
from typing import override
from django.utils.translation import gettext_lazy as _

class Favourite(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favourites', verbose_name=_("User"))

    class Meta:
        verbose_name = _("Favourite")
        verbose_name_plural = _("Favourites")

    @override
    def __str__(self):
        return f"Favourite list of {self.user.first_name} - {self.user.last_name}"

class FavouriteItem(BaseModel):
    favourite = models.ForeignKey(Favourite, on_delete=models.CASCADE, related_name='items', verbose_name=_("Favourite"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_("Product"))

    class Meta:
        verbose_name = _("Favourite Item")
        verbose_name_plural = _("Favourite Items")

    @override
    def __str__(self):
        return f'favourite items {self.product.name} in {self.favourite}'