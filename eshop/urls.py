from django.urls import path
from .views import *



app_name='shop'
urlpatterns = [
    path('', home, name='home'),
    path('list/', list_product, name='list_products'),
    path('add_product/', add_product, name='add_product'),
    path('find_and_edit_product', find_and_edit_product, name='find_and_edit_product'),
    path('edit_product/<int:pk>', edit_product, name='edit_product'),

    path('find_and_delete_product', find_and_delete_product, name='find_and_delete_product'),
    path('delete_product/<int:pk>', delete_product, name='delete_product')
]