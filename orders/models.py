from typing import override
from django.db import models
from common.models import BaseModel
from products.models import Product
from accounts.models import Address
from django.contrib.auth import get_user_model
class Order(BaseModel):
    class OrderStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        PROCESSING = 'processing', 'Processing'
        ON_HOLD = 'on_hold', 'On Hold'
        PACKING = 'packing', 'Packing'
        SHIPPED = 'shipped', 'Shipped'
        IN_DELIVERY = 'in_delivery', 'In Delivery'
        DELIVERED = 'delivered', 'Delivered'
        RETURN_REQUESTED = 'return_requested', 'Return Requested'
        RETURNED = 'returned', 'Returned'
        REFUNDED = 'refunded', 'Refunded'
        CANCELED = 'canceled', 'Canceled'
        FAILED = 'failed', 'Failed'
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    shipping_method = models.CharField(max_length=50)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0)
    discount_code = models.CharField(max_length=255, null=True, blank=True, default='None')

    @override
    def __str__(self):
        return f'{self.user.first_name} - {self.user.email} - {self.status}'


class OrderDetails(BaseModel):
    order= models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    @override
    def __str__(self):
        return f'{self.product.name} - {self.quantity}'