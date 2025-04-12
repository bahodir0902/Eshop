from django.shortcuts import render, get_object_or_404
from django.template.context_processors import request
from django.views import View
from products.models import Product, Category
from carts.models import CartItems, Cart
from eshop.models import Favourite, FavouriteItem
from activity.models import RecentProducts
from reviews.models import FeedBack
from django.db.models import Avg
import re
from orders.models import Order, OrderDetails


class ProductDetailView(View):
    def get(self,request, slug):
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

            orders = Order.objects.filter(user=request.user)
            for order in orders:
                if OrderDetails.objects.filter(order=order, product=product).exists():
                    can_submit_review = True

                    user_feedback = FeedBack.objects.filter(product=product, user=request.user).first()

        features = product.key_features.split(',') #features = [f.strip() for f in product.key_features.split(',') if f.strip()]


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
            'average_rating':  feedbacks.get('average_rating').get('average_rating', 0),
            'total_feedbacks': feedbacks.get('total_feedbacks'),
            'stars': feedbacks.get('stars'),
            'percentages': feedbacks.get('percentages'),
            'features': features,
            'specifications': specifications,
            'can_submit_review': can_submit_review,
            'user_feedback': user_feedback
        }

        return render(request, 'product_details.html', context=data)

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