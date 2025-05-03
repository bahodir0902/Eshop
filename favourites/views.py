import json
from django.db.models import ExpressionWrapper, F, FloatField
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from products.models import Product
from carts.models import CartItems, Cart
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from favourites.models import Favourite, FavouriteItem


class FavouriteView(LoginRequiredMixin, View):
    def get(self, request):
        favourite = Favourite.objects.filter(user=request.user).first()
        favourite_items = FavouriteItem.objects.filter(favourite=favourite)

        cart = Cart.objects.filter(user=request.user).first()
        cart_items = CartItems.objects.filter(cart=cart).annotate(
            total_price=ExpressionWrapper(F('product__price') * F('quantity'), output_field=FloatField())
        )

        cart_items_data = []
        for item in cart_items:
            cart_items_data.append({
                'id': item.id,
                'product_id': item.product.id,
                'quantity': item.quantity
            })

        data = {
            'favourite_items': favourite_items,
            'cart_items': cart_items,
            'cart_items_json': json.dumps(cart_items_data)
        }

        return render(request, 'favourites/favourites.html', context=data)

class AddFavouriteItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        favourite = Favourite.objects.filter(user=request.user).first()
        if not favourite:
            favourite = Favourite.objects.create(user=request.user)
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'success': False, 'error': 'Invalid product id'})
        item = FavouriteItem.objects.filter(favourite=favourite, product=product).first()
        if not item:
            FavouriteItem.objects.create(favourite=favourite, product=product)

        return JsonResponse({'success': True})


class RemoveFavouriteItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        favourite = Favourite.objects.filter(user=request.user).first()
        if not favourite:
            return JsonResponse({'success': False, 'error': 'Invalid user id. Perhaps you need to login.'})
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'success': False, 'error': 'Invalid product id'})

        FavouriteItem.objects.filter(favourite=favourite, product__id=product.pk).delete()
        return JsonResponse({'success': True})

class ClearFavourites(LoginRequiredMixin, View):
    def post(self, request):
        favourite = Favourite.objects.filter(user=request.user).first()
        FavouriteItem.objects.filter(favourite=favourite).delete()
        return JsonResponse({'success': True})