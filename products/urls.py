from django.urls import path
from products.models import Product, Category
from products.views import *

app_name = 'products'
urlpatterns = [
    path('', ProductDetailView.as_view(), name='product_detail')
]