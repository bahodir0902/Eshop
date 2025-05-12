from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.views import View

from carts.models import Cart, CartItems
from shops.models import Shop
from products.models import Product

class ShopDetailView(View):
    def get(self, request, pk):
        shop = get_object_or_404(Shop, id=pk)
        products = Product.objects.filter(shop=shop)

        cart_items_data = []
        if request.user.is_authenticated:
            try:
                cart = Cart.objects.get(user=request.user)
                cart_items = CartItems.objects.filter(cart=cart)
                cart_items_data = [
                    {
                        'id': item.id,
                        'product_id': item.product.id,
                        'quantity': item.quantity
                    }
                    for item in cart_items
                ]
            except Cart.DoesNotExist:
                pass

        data = {
            'shop': shop,
            'products': products,
            'cart_items_data': cart_items_data,

        }
        print(data)

        return render(request, "shops/shop_detail.html", context=data)