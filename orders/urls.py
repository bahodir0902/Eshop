from django.urls import path
from orders.views import *

app_name = 'orders'
urlpatterns = [
    path('', MyOrdersView.as_view(), name="my_orders"),
    path('checkout/', CheckoutView.as_view(), name='checkout'),

]