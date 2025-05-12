from reviews.models import FeedBack
from django.db.models import Avg

def update_shop_rating(shop):
    all_ratings = FeedBack.objects.filter(
        product__shop=shop,
        is_deleted=False
    ).aggregate(avg_rating=Avg('rating'))

    avg = all_ratings['avg_rating'] or 0
    shop.rate = round(avg, 2)
    shop.save(update_fields=["rate"])
