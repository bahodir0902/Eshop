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
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.i18n import set_language

from eshop.views import home
from favourites.views import FavouriteView, AddFavouriteItem, RemoveFavouriteItem, ClearFavourites

urlpatterns = [
    path('rosetta/', include('rosetta.urls')),
    path('i18n/', include('django.conf.urls.i18n')),

]

urlpatterns += i18n_patterns(
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('shops/', include('shops.urls')),
    path('products/', include('products.urls')),
    path('accounts/', include('accounts.urls')),
    path('cart/', include('carts.urls')),
    path('payment/', include('payments.urls')),
    path('orders/', include('orders.urls')),
    path('feedbacks/', include('reviews.urls')),
    path('common/', include('common.urls')),
    path('favourites/', include('favourites.urls')),
    path('notifications/', include('notifications.urls'))
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
