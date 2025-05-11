from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from products.models import Product
from reviews.models import FeedBack
from django.contrib.auth.decorators import login_required
from django.db import transaction

class FeedbackView(View):
    @method_decorator(login_required)
    @method_decorator(transaction.atomic)
    def post(self, request, product_id):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return HttpResponse("Fatal error, product not found", status=404)

        rating = request.POST.get('rating')
        comment = request.POST.get('comment', '').strip()
        is_anonymous = request.POST.get('is_anonymous') == 'true'

        if not rating:
            return JsonResponse({'success': False, "error": "Rating is not found or must be between 1 and 5"})

        FeedBack.objects.filter(user=request.user, product=product).delete()

        feedback = FeedBack.objects.create(
            user=request.user,
            product=product,
            rating=rating,
            comment=comment,
            is_anonymous=is_anonymous
        )

        if 'image' in request.FILES:
            feedback.image = request.FILES.get('image')
            feedback.save()
        return JsonResponse({"success": True})

    @method_decorator(login_required)
    @method_decorator(transaction.atomic)
    def delete(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        FeedBack.objects.filter(user=request.user, product=product).delete()

        return JsonResponse({"success": True})