from django.test import TestCase
from django.urls import reverse, resolve
from orders.views import MyOrdersView, CheckoutView


class OrderURLsTest(TestCase):
    def test_my_orders_url_resolves(self):
        """Test the my orders URL"""
        url = reverse('orders:my_orders')
        self.assertEqual(resolve(url).func.view_class, MyOrdersView)

    def test_checkout_url_resolves(self):
        """Test the checkout URL"""
        url = reverse('orders:checkout')
        self.assertEqual(resolve(url).func.view_class, CheckoutView)