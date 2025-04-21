from typing import override
from django.db import models
from common.models import BaseModel
from orders.models import Order
from django.utils.translation import gettext_lazy as _


class Payment(BaseModel):
    class PaymentMethods(models.TextChoices):
        CASH = 'cash', _('Cash')
        CREDIT_CARD = 'credit_card', _('Credit Card')
        DEBIT_CARD = 'debit_card', _('Debit Card')

    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("Order"))
    payment_method = models.CharField(_("Payment Method"), max_length=100, choices=PaymentMethods.choices)
    amount = models.DecimalField(_("Amount"), max_digits=10, decimal_places=4)
    status = models.CharField(_("Status"), max_length=30)
    currency = models.CharField(_("Currency"), max_length=50)

    class Meta:
        verbose_name = _("Payment")
        verbose_name_plural = _("Payments")

    @override
    def __str__(self):
        return f'{self.order.pk} - {self.amount} - {self.status}'