from django.test import TestCase
from django.urls import reverse, resolve
from payments.views import PaymentView, PaymentSuccessView


class PaymentURLsTest(TestCase):
    def test_payment_url_resolves(self):
        """Test the payment URL"""
        url = reverse('payments:payment')
        self.assertEqual(resolve(url).func.view_class, PaymentView)

    def test_payment_success_url_resolves(self):
        """Test the payment success URL"""
        url = reverse('payments:payment_success')
        self.assertEqual(resolve(url).func.view_class, PaymentSuccessView)