from django.db import models
from accounts.models import User
from common.models import BaseModel

class AvailableProducts(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_available=True)


# Create your models here.
class Product(BaseModel):
    name = models.CharField(max_length=255)
    price = models.DecimalField(decimal_places=2, max_digits=10)
    is_available = models.BooleanField(default=True)
    description = models.TextField()

    objects = AvailableProducts()

class Orders(BaseModel):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

class OrderDetails(BaseModel):
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE)
    product_id = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()




