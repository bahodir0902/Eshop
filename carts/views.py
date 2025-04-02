from django.http import JsonResponse
from django.shortcuts import render
from django.template.defaultfilters import first
from django.views import View
from carts.models import Cart, CartItems
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import F, Sum, ExpressionWrapper, FloatField
from products.models import Product
from django.db.models import Q
from django.views.decorators.http import require_POST

class CartView(LoginRequiredMixin, View):
    def get(self, request):
        cart = Cart.objects.filter(user=request.user).first()
        cart_items = CartItems.objects.filter(cart=cart).annotate(
            total_price=ExpressionWrapper(F('product__price') * F('quantity'), output_field=FloatField())
        )

        return render(request, 'my_cart.html', {'cart_items': cart_items})


class AddCartItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        cart = Cart.objects.filter(user=request.user).first()
        quantity = request.POST.get('quantity', 1)

        if not cart:
            cart = Cart.objects.create(user=request.user)

        product = Product.objects.filter(pk=pk).first()
        if not product:
            return JsonResponse({'success': False, 'error': 'Product id not found. Please try again later.'})

        if not CartItems.objects.filter(Q(cart=cart) & Q(product=product)).exists():
            item = CartItems.objects.create(cart=cart, quantity=quantity, product=product)
            return JsonResponse({'success': True, 'item_id': item.pk})

        item = CartItems.objects.filter(Q(cart=cart) & Q(product=product)).first()
        if not item:
            return JsonResponse({'success': False, 'error': 'Fatal Internal Server error.'})

        item.quantity += int(quantity)
        item.save()

        return JsonResponse({'success': True, 'item_id': item.pk})


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
        print(f'{quantity=}')
        item.quantity = int(quantity)
        item.save()

        return JsonResponse({'success': True})


class RemoveCartItem(LoginRequiredMixin, View):
    def post(self, request, pk):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return JsonResponse({'success': False, 'error': 'Fatal Internal Server error.'})

        CartItems.objects.filter(Q(cart=cart) & Q(product__id=pk)).delete()
        print('salom')
        return JsonResponse({'success': True})


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
        return JsonResponse({'success': True})
    except CartItems.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Item not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})