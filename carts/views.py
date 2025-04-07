import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from carts.models import Cart, CartItems
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import F, Q, ExpressionWrapper, FloatField
from products.models import Product


class CartView(LoginRequiredMixin, View):
    def get(self, request):
        cart = Cart.objects.filter(user=request.user).first()
        cart_items = CartItems.objects.filter(cart=cart).annotate(
            total_price=ExpressionWrapper(F('product__price') * F('quantity'), output_field=FloatField())
        )

        return render(request, 'my_cart.html', {'cart_items': cart_items})


class AddCartItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        quantity = request.POST.get('quantity', None)
        if not quantity:
            try:
                data = json.loads(request.body)
                quantity = data.get('quantity', 1)
            except json.JSONDecodeError:
                quantity = 1

        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            quantity = 1

        cart, _ = Cart.objects.get_or_create(user=request.user)
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'success': False, 'error': 'Product not found'})

        item, created = CartItems.objects.get_or_create(
            cart=cart, product=product, defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        cart_items_count = CartItems.objects.filter(cart=cart).count()
        return JsonResponse({
            'success': True,
            'item_id': item.pk,
            'quantity': item.quantity,
            'cart_count': cart_items_count
        })


class UpdateCartItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        cart = Cart.objects.filter(user=request.user).first()
        quantity = request.POST.get('quantity', 1)

        if not cart:
            cart = Cart.objects.create(user=request.user)

        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'success': False, 'error': 'Product id not found. Please try again later.'})

        if not CartItems.objects.filter(Q(cart=cart) & Q(product=product)).exists():
            CartItems.objects.create(cart=cart, quantity=quantity, product=product)
            return JsonResponse({'success': True})

        item = CartItems.objects.filter(Q(cart=cart) & Q(product=product)).first()
        if not item:
            return JsonResponse({'success': False, 'error': 'Fatal Internal Server error.'})
        try:
            item.quantity = int(quantity)
            item.save()
        except (ValueError, TypeError) as e:
            return JsonResponse({'success': F, 'error': 'quantity is not integer object'})

        return JsonResponse({'success': True})


class RemoveCartItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return JsonResponse({'success': False, 'error': 'Fatal Internal Server error.'})

        CartItems.objects.filter(Q(cart=cart) & Q(product__id=pk)).delete()
        cart_items_count = CartItems.objects.filter(cart=cart).count()
        return JsonResponse({'success': True, 'cart_count': cart_items_count})


class ClearCartItem(LoginRequiredMixin, View):
    def post(self, request):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return JsonResponse({'success': False, 'error': 'Cart id not found. Perhaps you need to login.'})

        CartItems.objects.filter(cart=cart).delete()
        Cart.objects.filter(user=request.user).delete()

        return JsonResponse({'success': True})


def remove_cart_item_in_list(request, pk):
    try:
        cart_item = CartItems.objects.get(id=pk, cart__user=request.user)
        cart_item.delete()
        cart_items_count = CartItems.objects.filter(cart__user=request.user).count()
        return JsonResponse({'success': True, 'cart_count': cart_items_count})
    except CartItems.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Item not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})