from django.db import models
from common.models import BaseModel
from accounts.models import User
from products.models import Product

class RecentProducts(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recent_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

