from django.shortcuts import render
from products.models import Product, Category
from shops.models import Shop
from django.db.models import Count


def home(request):
    """
    Home page view that showcases featured products, categories,
    popular shops, and new products.
    """
    # Get featured products (limited to 4)
    featured_products = Product.available_products.filter(
        is_featured=True, is_approved=True
    ).order_by('-created_at')[:4]

    # Get categories with product count
    categories = Category.objects.annotate(
        product_count=Count('product_category')
    ).filter(product_count__gt=0).order_by('-product_count')[:6]

    # Get popular shops based on product count
    popular_shops = Shop.objects.annotate(
        product_count=Count('products')
    ).filter(product_count__gt=0).order_by('-product_count')[:3]

    # Get newest products (limited to 4)
    new_products = Product.available_products.filter(
        is_approved=True
    ).order_by('-created_at')[:4]

    context = {
        'featured_products': featured_products,
        'categories': categories,
        'popular_shops': popular_shops,
        'new_products': new_products,
    }

    return render(request, 'home.html', context)