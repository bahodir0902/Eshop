from django.db import models
from common.models import BaseModel
from accounts.models import User
from products.models import Product
from django.utils.translation import gettext_lazy as _

class RecentProducts(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recent_products', verbose_name=_("User"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_("Product"))

    class Meta:
        verbose_name = _("Recent Product")
        verbose_name_plural = _("Recent Products")