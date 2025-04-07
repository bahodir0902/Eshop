from typing import override
from django.db import models
from common.models import BaseModel
from orders.models import Order

class Payment(BaseModel):
    class PaymentMethods(models.TextChoices):
        CASH = 'cash', 'Cash'
        CREDIT_CARD = 'credit_card', 'Credit Card'
        DEBIT_CARD = 'debit_card', 'Debit Card'
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    payment_method = models.CharField(max_length=100, choices=PaymentMethods.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=4)
    status = models.CharField(max_length=30)
    currency = models.CharField(max_length=50)

    @override
    def __str__(self):
        return f'{self.order.pk} - {self.amount} - {self.status}'
