from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from carts.models import CartItems, Cart
from favourites.models import Favourite, FavouriteItem


class GetCounts(View):
    def get(self, request):
        if request.user.is_authenticated:
            cart = Cart.objects.filter(user=request.user).first()
            cart_items_count = CartItems.objects.filter(cart=cart).count()

            favourite = Favourite.objects.filter(user=request.user).first()
            favourite_items_count = FavouriteItem.objects.filter(favourite=favourite).count()

            return JsonResponse({"cart_count": cart_items_count,
                                 "wishlist_count": favourite_items_count
                                 })

        return JsonResponse({"cart_count": 0, "wishlist_count": 0})
