from django.urls import path, include
from carts.views import *

app_name = 'cart'
urlpatterns = [
    path('', CartView.as_view(), name='list'),
    path('add_item/<int:pk>', AddCartItem.as_view(), name='add_cart_item'),
    path('update_item/<int:pk>', UpdateCartItem.as_view(), name='update_cart_item'),
    path('remove_item/<int:pk>', RemoveCartItem.as_view(), name='remove_cart_item'),
    path('remove_cart_item_in_list/<int:pk>', remove_cart_item_in_list, name='remove_cart_item_in_list'),
    path('clear/', ClearCartItem.as_view(), name='clear_cart')

]