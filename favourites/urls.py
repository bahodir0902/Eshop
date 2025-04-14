from django.urls import path
from favourites.views import *

app_name = "favourites"
urlpatterns = [
    path('', FavouriteView.as_view(), name='favourites'),
    path('add_favourite_item/<int:pk>', AddFavouriteItem.as_view(), name='add_favourite_item'),
    path('remove_favourite_item/<int:pk>', RemoveFavouriteItem.as_view(), name='remove_favourite_item'),
    path('clear_favourites/', ClearFavourites.as_view(), name='clear_favourites')
]