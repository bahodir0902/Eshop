from django.urls import path
from . import views

app_name = 'shops'

urlpatterns = [
    path('add/', views.AddShopView.as_view(), name='add_shop'),
]