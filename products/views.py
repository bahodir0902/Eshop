from django.shortcuts import render, get_object_or_404
from django.views import View
from products.models import Product, Category
from carts.models import CartItems, Cart
from eshop.models import Favourite, FavouriteItem


class ProductDetailView(View):
    def get(self,request, slug):
        product = get_object_or_404(Product, slug=slug)
        related_products = Product.objects.exclude(pk=product.pk).filter(category=product.category)

        cart_items = None
        favourite_items = None
        if request.user.is_authenticated:
            favourite = Favourite.objects.filter(user=request.user).first()
            favourite_items = FavouriteItem.objects.filter(favourite=favourite)

            cart = Cart.objects.filter(user=request.user).first()
            cart_items = CartItems.objects.filter(cart=cart)

        data = {
            'product': product,
            'related_products': related_products,
            'favourite_items': favourite_items,
            'cart_items': cart_items
        }
        return render(request, 'product_details.html', context=data)