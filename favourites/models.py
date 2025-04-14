from django.db import models
from common.models import BaseModel
from accounts.models import User
from products.models import Product
from typing import override

class Favourite(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favourites')

    @override
    def __str__(self):
        return f"Favourite list of {self.user.first_name} - {self.user.last_name}"

class FavouriteItem(BaseModel):
    favourite = models.ForeignKey(Favourite, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    @override
    def __str__(self):
        return f'favourite items {self.product.name} in {self.favourite}'