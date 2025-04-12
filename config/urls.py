"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from eshop.views import FavouriteView, AddFavouriteItem, RemoveFavouriteItem, ClearFavourites

urlpatterns = [
    path('admin/', admin.site.urls),
    path('shop/', include('eshop.urls')),
    path('accounts/', include('accounts.urls')),
    path('cart/', include('carts.urls')),
    path('favourites/', FavouriteView.as_view(), name='favourites'),
    path('add_favourite_item/<int:pk>', AddFavouriteItem.as_view(), name='add_favourite_item'),
    path('remove_favourite_item/<int:pk>', RemoveFavouriteItem.as_view(), name='remove_favourite_item'),
    path('clear_favourites/', ClearFavourites.as_view(), name='clear_favourites'),
    # path('checkout/', include('orders.urls')),
    path('payment/', include('payments.urls')),
    path('orders/', include('orders.urls')),
    path('feedbacks/', include('reviews.urls')),
    path('common/', include('common.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
