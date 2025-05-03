from django.core.exceptions import ValidationError
from django.db.models import ExpressionWrapper, F, Sum, FloatField
from django.http import HttpResponse
from django.shortcuts import render, redirect
from accounts.models import User, Address
from carts.models import Cart, CartItems
from products.models import Product
from orders.models import Order, OrderDetails
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from accounts.forms import UserAddressForm
from payments.models import Payment


class MyOrdersView(LoginRequiredMixin, View):
    def get(self, request):
        orders = Order.objects.filter(user=request.user).exclude(status='pending')
        items = []
        for order in orders:
            items.append(OrderDetails.objects.filter(order=order))

        data = {
            'items': items
        }

        return render(request, "orders/my_orders.html", context=data)


class CheckoutView(LoginRequiredMixin, View):
    def get(self, request):
        cart = Cart.objects.filter(user=request.user).first()
        cart_items = CartItems.objects.filter(cart=cart).annotate(
            total_price=ExpressionWrapper(F('product__price') * F('quantity'), output_field=FloatField())
        )
        subtotal = cart_items.aggregate(subtotal=Sum(F('product__price') * F('quantity')))['subtotal']

        if not cart_items.exists():
            return HttpResponse("Cart should contain at least one item.")

        address = Address.objects.filter(user=request.user).first()
        address_form = UserAddressForm(instance=address)

        data = {
            'cart_items': cart_items,
            'address_form': address_form,
            'subtotal': subtotal
        }
        return render(request, 'orders/checkout.html', context=data)

    def post(self, request):
        user_address = Address.objects.filter(user=request.user).first()
        address_form = UserAddressForm(instance=user_address, data=request.POST)
        save_primary = request.POST.get('save_primary') == 'on'
        phone_number = request.POST.get('phone', None)
        delivery_option = request.POST.get('delivery_option')
        delivery_costs = {
            'standard': 5.99,
            'express': 12.99,
            'next_day': 19.99
        }
        delivery_cost = delivery_costs.get(delivery_option, 0)

        cart = Cart.objects.filter(user=request.user).first()
        cart_items = CartItems.objects.filter(cart=cart)

        if not cart_items.exists():
            return HttpResponse('Cart is empty. Please fill the cart and come back.')

        if address_form.is_valid():
            shipping_address = None
            if save_primary:
                address = address_form.save(commit=False)
                address.user = request.user
                address.is_primary = True
                address.save()
                shipping_address = address
            else:
                address_data = address_form.cleaned_data
                shipping_address = Address.objects.create(
                    user=request.user,
                    address_line_1=address_data['address_line_1'],
                    address_line_2=address_data.get('address_line_2', ''),
                    city=address_data['city'],
                    country=address_data['country'],
                    postal_code=address_data['postal_code'],
                    is_primary=False,
                    state_or_province=address_data.get('state_or_province', '')
                )

            if phone_number:
                User.objects.filter(pk=request.user.pk).update(phone_number=phone_number)

            Order.objects.filter(user=request.user, status='pending').delete()
            order = Order.objects.create(
                user=request.user,
                shipping_address=shipping_address,
                shipping_method=delivery_option,
                shipping_cost=delivery_cost
            )
            order_details = OrderDetails.objects.filter(order=order)
            if order_details.exists():
                order_details.delete()

            for item in cart_items:
                OrderDetails.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity
                )
            try:
                request.session.pop('new_order_id')
            except Exception as e:
                pass
            request.session['new_order_id'] = order.pk
            return redirect('payments:payment')

        data = {
            'cart_items': cart_items,
            'address_form': address_form
        }

        return render(request, 'orders/checkout.html', context=data)
