from django.urls import path
from .views import *



app_name='shop'
urlpatterns = [
    path('', home, name='home'),
    path('list/', ListProductView.as_view(), name='list_products'),
    path('add_product/', AddProductView.as_view(), name='add_product'),
    path('find_and_edit_product', FindAndEditProduct.as_view(), name='find_and_edit_product'),
    path('edit_product/<int:pk>', EditProductView.as_view(), name='edit_product'),

    path('find_and_delete_product', FindAndDeleteProduct.as_view(), name='find_and_delete_product'),
    path('delete_product/<int:pk>', delete_product, name='delete_product')
]