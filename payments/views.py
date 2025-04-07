from datetime import timedelta
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views import View
from carts.models import Cart, CartItems
from orders.models import Order, OrderDetails
from payments.models import Payment
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import F, Sum
from django.contrib import messages
from django.utils import timezone


class PaymentView(LoginRequiredMixin, View):
    def get(self, request):
        pk = request.session.get('new_order_id', None)
        data = self.fetch_details(pk)
        return render(request, 'payment.html', context=data)

    def post(self, request):
        pk = request.session.get('new_order_id', None)
        card_name: str = request.POST.get('card_name')
        card_number: str = request.POST.get('card_number')
        expiry_date: str = request.POST.get('expiry_date')
        cvv: str = request.POST.get('cvv')
        data = self.fetch_details(pk)

        if not card_name:
            messages.error(request, "Card holder's first name and last name are not provided")
            return render(request, 'payment.html', context=data)

        if not card_number or not card_number.replace(' ', '').isdigit() or not len(card_number.replace(' ', '')) in (
        15, 16):
            messages.error(request, "Card number not provided or number's length is not valid")
            return render(request, 'payment.html', context=data)

        if not expiry_date or '/' not in expiry_date:
            messages.error(request, "Expiry date is not provided or provided in wrong format (no / between MM and YY).")
            return render(request, 'payment.html', context=data)

        if not cvv or len(cvv) not in [3, 4]:
            messages.error(request, "Cvv is not provided or provided with wrong length")
            return render(request, 'payment.html', context=data)

        Order.objects.filter(pk=pk).update(status='paid')

        cart = Cart.objects.filter(user=request.user)
        CartItems.objects.filter(cart=cart.first()).delete()
        cart.delete()

        Payment.objects.create(
            order_id=pk,
            payment_method='debit_card',
            amount=data.get('total_order_cost'),
            status='paid',
            currency='USD'
        )

        return redirect('payments:payment_success')

    @staticmethod
    def fetch_details(pk):
        order = Order.objects.filter(pk=pk).first()
        order_details = OrderDetails.objects.filter(order=order).annotate(
            total_price=F('product__price') * F('quantity'))
        if not order_details.exists():
            return HttpResponse("Fatal error! Order id in session not found. Please go back and try again hacker!")
        subtotal = order_details.aggregate(total=Sum(F('product__price') * F('quantity')))['total']
        shipping_cost = order.shipping_cost
        total_order_cost = subtotal + shipping_cost

        if not order_details.exists():
            return HttpResponse("Order is empty. Please try again filling cart.")

        data = {
            'order_details': order_details,
            'subtotal_order_price': subtotal,
            'shipping_cost': shipping_cost,
            'total_order_cost': total_order_cost
        }
        return data

class PaymentSuccessView(LoginRequiredMixin, View):
    def get(self, request):
        pk = request.session.get('new_order_id')
        data = PaymentView.fetch_details(pk)
        order = Order.objects.filter(pk=pk).first()
        options = {
            'standard': timezone.now() + timedelta(days=5),
            'express': timezone.now() + timedelta(days=2),
            'next_day': timezone.now() + timedelta(days=1),
        }
        try:
            delivery_date = options[order.shipping_method]
        except Exception as e:
            delivery_date = timezone.now() + timedelta(days=5)

        data['order_number'] = pk
        data['address_line_1'] = order.shipping_address.address_line_1
        data['address_line_2'] = order.shipping_address.address_line_2
        data['postal_code'] = order.shipping_address.postal_code
        data['city'] = order.shipping_address.city
        data['state'] = order.shipping_address.state_or_province
        data['country'] = order.shipping_address.country
        data['delivery_date'] = delivery_date

        return render(request, 'payment_success.html', context=data)