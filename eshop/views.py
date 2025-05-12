from django.shortcuts import render

from carts.models import Cart, CartItems
from products.models import Product, Category
from shops.models import Shop
from django.db.models import Count


def home(request):
    featured_products = Product.available_products.filter(
        is_featured=True, is_approved=True
    ).order_by('-created_at')[:4]

    categories = Category.objects.annotate(
        product_count=Count('product_category')
    ).filter(product_count__gt=0).order_by('-product_count')[:6]

    popular_shops = Shop.objects.annotate(
        product_count=Count('products')
    ).filter(product_count__gt=0).order_by('-product_count')[:3]

    new_products = Product.available_products.filter(
        is_approved=True
    ).order_by('-created_at')[:4]

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

    context = {
        'featured_products': featured_products,
        'categories': categories,
        'popular_shops': popular_shops,
        'new_products': new_products,
        'cart_items_data': cart_items_data,
    }

    return render(request, 'home.html', context)