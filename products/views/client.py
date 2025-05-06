import hashlib
from django.contrib.postgres.search import TrigramSimilarity
from django.core.cache import cache
from django.core.paginator import Paginator
from django.db.models import Q, Sum, Avg, Count
from django.shortcuts import render, get_object_or_404
from django_ratelimit.decorators import ratelimit
from products.models import Product, Category
from carts.models import CartItems, Cart
from favourites.models import Favourite, FavouriteItem
from reviews.models import FeedBack
from activity.models import RecentProducts
import re
from orders.models import Order, OrderDetails
from django.views import View
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


def fetch_product(request):
    q = request.GET.get('q')
    page_number = request.GET.get('page')
    per_page = request.GET.get('per_page')
    category_id = request.GET.get('category')
    sort = request.GET.get('sort')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    rating = request.GET.get('rating')

    if category_id == '5' or category_id == 5:
        raw_key = f"electronics_products:{q}:{sort}:{page_number}:{per_page}"
        key = hashlib.md5(raw_key.encode()).hexdigest()
        cached_page = cache.get(key)

        if cached_page:
            return cached_page

    products = Product.objects.all().order_by('-is_available', 'name', 'created_at')

    if category_id:
        db_category = Category.objects.filter(pk=category_id).first()
        subcategories = db_category.get_all_subcategories()
        subcategories_id = [cat.id for cat in subcategories] + [db_category.id]
        products = Product.objects.filter(category_id__in=subcategories_id)

    if q and q != 'None':
        products = products.annotate(
            similarity_name=TrigramSimilarity('name', q),
            similarity_short=TrigramSimilarity('short_description', q),
            similarity_full=TrigramSimilarity('full_description', q),
        ).filter(
            Q(similarity_name__gt=0.2) |
            Q(similarity_short__gt=0.2) |
            Q(similarity_full__gt=0.2)
        ).order_by(
            '-similarity_name',
            '-similarity_short',
            '-similarity_full'
        )

    if sort == 'price_asc':
        products = products.order_by('price')
    if sort == 'price_desc':
        products = products.order_by('-price')
    if sort == 'name_asc':
        products = products.order_by('name')
    if sort == 'name_desc':
        products = products.order_by('-name')
    if sort == 'orders_asc':
        products = products.annotate(order_count=Count('ordered_product')).order_by('order_count')
    if sort == 'orders_desc':
        products = products.annotate(order_count=Count('ordered_product')).order_by('-order_count')
    if sort == 'newest':
        products = products.order_by('-created_at')

    if rating and rating.isdigit():
        products = products.annotate(avg_rating=Avg('feedbacks__rating')).filter(avg_rating__gte=int(rating))

    if min_price and min_price.isdigit():
        products = products.filter(price__gte=min_price)

    if max_price and max_price.isdigit():
        products = products.filter(price__lte=max_price)

    products = products.annotate(stock_count=Sum('inventory__stock_count'))
    products = products.annotate(rating=Avg('feedbacks__rating'))
    products = products.annotate(total_ordered=Count('ordered_product'))

    paginator = Paginator(products, per_page) if per_page else Paginator(products, 32)
    products = paginator.get_page(page_number)

    if category_id == '5' or category_id == 5:
        cache.set(key, products, timeout=60 * 30)

    return products


class ProductListView(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='20/m', block=True))
    def get(self, request):

        products = fetch_product(request)

        data = {
            'products': products
        }

        cart = None
        favourite = None
        if request.user.is_authenticated:
            cart = Cart.objects.filter(user=request.user).first()
            favourite = Favourite.objects.filter(user=request.user).first()

        if cart:
            cart_items = CartItems.objects.filter(cart=cart)
            data['cart_items'] = cart_items

        if favourite:
            favourite_items = FavouriteItem.objects.filter(favourite=favourite)
            data['favourite_items'] = favourite_items

        categories = Category.objects.all().annotate(product_count=Count('product_category'))
        # categories = Category.objects.filter(parent_category=None).annotate(product_count=Count('product_category'))
        # for category in categories:
        #     pass

        data['categories'] = categories

        return render(request, 'products/list_products.html', context=data)


class ProductDetailView(View):
    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        related_products = Product.objects.exclude(pk=product.pk).filter(category=product.category)

        feedbacks = self.get_feedbacks(product)

        can_submit_review = False
        user_feedback = None
        cart_items = None
        favourite_items = None
        recent_products = None

        if request.user.is_authenticated:
            favourite = Favourite.objects.filter(user=request.user).first()
            favourite_items = FavouriteItem.objects.filter(favourite=favourite)

            cart = Cart.objects.filter(user=request.user).first()
            cart_items = CartItems.objects.filter(cart=cart)

            recent_products = RecentProducts.objects.filter(user=request.user)
            current_item = RecentProducts.objects.filter(user=request.user, product=product).first()

            if not current_item:
                RecentProducts.objects.create(user=request.user, product=product)

            orders = Order.objects.filter(user=request.user, status='delivered')
            for order in orders:
                if OrderDetails.objects.filter(order=order, product=product).exists():
                    can_submit_review = True

                    user_feedback = FeedBack.objects.filter(product=product, user=request.user).first()

        features = product.key_features.split(
            ',')  # features = [f.strip() for f in product.key_features.split(',') if f.strip()]

        raw_specifications = product.specifications

        items = re.split(r'[,\n]+', raw_specifications)
        specifications = {}
        for item in items:
            item = item.strip()
            if ':' in item:
                key, value = item.split(':', 1)  # only split on the first colon
                specifications[key.strip()] = value.strip()

        data = {
            'product': product,
            'related_products': related_products,
            'favourite_items': favourite_items,
            'cart_items': cart_items,
            'recent_products': recent_products,
            'feedbacks': feedbacks.get('feedbacks'),
            'average_rating': feedbacks.get('average_rating').get('average_rating', 0),
            'total_feedbacks': feedbacks.get('total_feedbacks'),
            'stars': feedbacks.get('stars'),
            'percentages': feedbacks.get('percentages'),
            'features': features,
            'specifications': specifications,
            'can_submit_review': can_submit_review,
            'user_feedback': user_feedback
        }

        return render(request, 'products/product_details.html', context=data)

    def get_feedbacks(self, product: Product):
        feedbacks = FeedBack.objects.filter(product=product)
        average_rating = feedbacks.aggregate(average_rating=Avg('rating'))
        total_feedbacks = feedbacks.count()

        total_1_stars = feedbacks.filter(rating=1).count()
        total_2_stars = feedbacks.filter(rating=2).count()
        total_3_stars = feedbacks.filter(rating=3).count()
        total_4_stars = feedbacks.filter(rating=4).count()
        total_5_stars = feedbacks.filter(rating=5).count()

        total = total_feedbacks or 1
        stars = {
            5: total_5_stars,
            4: total_4_stars,
            3: total_3_stars,
            2: total_2_stars,
            1: total_1_stars
        }

        percentages = {star: (count / total) * 100 for star, count in stars.items()}

        data = {
            'feedbacks': feedbacks,
            'average_rating': average_rating,
            'total_feedbacks': total_feedbacks,
            'stars': stars,
            'percentages': percentages
        }

        return data
