from django.urls import path
from . import views
from .views import ShopDetailView

app_name = 'shops'

urlpatterns = [
    path('add/', views.AddShopView.as_view(), name='add_shop'),
    path('<int:pk>', ShopDetailView.as_view(), name="shop_detail")
]