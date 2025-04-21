from typing import override
from django.db import models
from common.models import BaseModel
from products.models import Product
from accounts.models import Address
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _


class Order(BaseModel):
    class OrderStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PAID = 'paid', _('Paid')
        PROCESSING = 'processing', _('Processing')
        ON_HOLD = 'on_hold', _('On Hold')
        PACKING = 'packing', _('Packing')
        SHIPPED = 'shipped', _('Shipped')
        IN_DELIVERY = 'in_delivery', _('In Delivery')
        DELIVERED = 'delivered', _('Delivered')
        RETURN_REQUESTED = 'return_requested', _('Return Requested')
        RETURNED = 'returned', _('Returned')
        REFUNDED = 'refunded', _('Refunded')
        CANCELED = 'canceled', _('Canceled')
        FAILED = 'failed', _('Failed')

    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("User"))
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True,
                                         verbose_name=_("Shipping Address"))
    status = models.CharField(_("Status"), max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    shipping_method = models.CharField(_("Shipping Method"), max_length=50)
    shipping_cost = models.DecimalField(_("Shipping Cost"), max_digits=10, decimal_places=4, default=0.0)
    discount_code = models.CharField(_("Discount Code"), max_length=255, null=True, blank=True, default='None')

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")

    @override
    def __str__(self):
        return f'{self.user.first_name} - {self.user.email} - {self.status}'


class OrderDetails(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, verbose_name=_("Order"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ordered_product',
                                verbose_name=_("Product"))
    quantity = models.IntegerField(_("Quantity"))

    class Meta:
        verbose_name = _("Order Detail")
        verbose_name_plural = _("Order Details")

    @override
    def __str__(self):
        return f'{self.product.name} - {self.quantity}'