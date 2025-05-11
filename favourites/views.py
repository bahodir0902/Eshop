import json
from django.db.models import ExpressionWrapper, F, FloatField
from django.http import JsonResponse
from django.shortcuts import render
from products.models import Product
from carts.models import CartItems, Cart
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from favourites.models import Favourite, FavouriteItem
from django.db import transaction
from django.utils.decorators import method_decorator


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
    @method_decorator(transaction.atomic)
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
    @method_decorator(transaction.atomic)
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
    @method_decorator(transaction.atomic)
    def post(self, request):
        favourite = Favourite.objects.filter(user=request.user).first()
        FavouriteItem.objects.filter(favourite=favourite).delete()
        return JsonResponse({'success': True})


class CheckFavouriteItem(LoginRequiredMixin, View):
    def get(self, request, pk):
        favourite = Favourite.objects.filter(user=request.user).first()
        if not favourite:
            return JsonResponse({'is_favorite': False})

        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'is_favorite': False})

        item = FavouriteItem.objects.filter(favourite=favourite, product=product).exists()

        return JsonResponse({'is_favorite': item})