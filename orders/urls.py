from django.urls import path
from orders.views import *

app_name = 'orders'
urlpatterns = [
    path('', CheckoutView.as_view(), name='checkout')
]