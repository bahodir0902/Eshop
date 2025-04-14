from django.urls import path
from products.views.client import *
from products.views.admin import *

app_name = 'products'

urlpatterns = [
    path('', ProductListView.as_view(), name='products'),
    path('<str:slug>', ProductDetailView.as_view(), name='product_detail'),
    path('add_product/', AddProductView.as_view(), name='add_product'),
    path('manage_products/', ManageProductView.as_view(), name='manage_products'),
    path('edit_product/<int:pk>', EditProductView.as_view(), name='edit_product'),
    path('delete_product/<int:pk>', delete_product, name='delete_product')
]