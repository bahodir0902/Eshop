from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.messages import get_messages
from payments.models import Payment
from orders.models import Order, OrderDetails
from accounts.models import User, Address
from products.models import Product, Inventory, Shop
from carts.models import Cart, CartItems
from decimal import Decimal
from accounts.utils import get_random_username

class PaymentViewTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create test address
        self.address = Address.objects.create(
            user=self.user,
            address_line_1='123 Test St',
            city='Test City',
            country='Test Country',
            postal_code='12345',
            is_primary=True
        )

        # Create test shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create test inventory
        self.inventory = Inventory.objects.create(
            stock_count=10,
            warehouse_location='Test Location'
        )

        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            price=Decimal('99.99'),
            shop=self.shop,
            slug='test-product',
            inventory=self.inventory
        )

        # Create test cart
        self.cart = Cart.objects.create(
            user=self.user
        )

        # Create test cart item
        self.cart_item = CartItems.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            shipping_method='standard',
            shipping_cost=Decimal('5.99')
        )

        # Create test order details
        self.order_details = OrderDetails.objects.create(
            order=self.order,
            product=self.product,
            quantity=2
        )

        # Set order id in session
        session = self.client.session
        session['new_order_id'] = self.order.pk
        session.save()

        # Login the user
        self.client.login(email='testuser@example.com', password='testpassword')

    def test_payment_view_get(self):
        """Test payment view GET request"""
        response = self.client.get(reverse('payments:payment'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment.html')

        # Check context
        self.assertEqual(len(response.context['order_details']), 1)
        self.assertEqual(response.context['subtotal_order_price'], Decimal('199.98'))  # 99.99 * 2
        self.assertEqual(response.context['shipping_cost'], Decimal('5.99'))
        self.assertEqual(response.context['total_order_cost'], Decimal('205.97'))  # 199.98 + 5.99

    def test_payment_view_post_valid(self):
        """Test payment view POST with valid payment data"""
        post_data = {
            'card_name': 'Test User',
            'card_number': '4111 1111 1111 1111',
            'expiry_date': '12/25',
            'cvv': '123'
        }

        response = self.client.post(reverse('payments:payment'), post_data)

        # Should redirect to payment success
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('payments:payment_success'))

        # Check if order status was updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'paid')

        # Check if payment was created
        payment = Payment.objects.filter(order=self.order).first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.payment_method, 'debit_card')
        self.assertEqual(payment.amount, Decimal('205.97'))
        self.assertEqual(payment.status, 'paid')

        # Check if cart was cleared
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)
        self.assertEqual(CartItems.objects.filter(cart__user=self.user).count(), 0)

    def test_payment_view_post_invalid_card_name(self):
        """Test payment view POST with invalid card name"""
        post_data = {
            'card_name': '',  # Empty card name
            'card_number': '4111 1111 1111 1111',
            'expiry_date': '12/25',
            'cvv': '123'
        }

        response = self.client.post(reverse('payments:payment'), post_data)

        # Should stay on payment page
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment.html')

        # Check for error message
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn("Card holder's first name and last name are not provided", str(messages[0]))

        # Order status should not be changed
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'pending')

    def test_payment_view_post_invalid_card_number(self):
        """Test payment view POST with invalid card number"""
        post_data = {
            'card_name': 'Test User',
            'card_number': '1234',  # Invalid card number
            'expiry_date': '12/25',
            'cvv': '123'
        }

        response = self.client.post(reverse('payments:payment'), post_data)

        # Should stay on payment page
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment.html')

        # Check for error message
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn("Card number not provided or number's length is not valid", str(messages[0]))

    def test_payment_view_post_invalid_expiry_date(self):
        """Test payment view POST with invalid expiry date"""
        post_data = {
            'card_name': 'Test User',
            'card_number': '4111 1111 1111 1111',
            'expiry_date': '1225',  # Invalid format
            'cvv': '123'
        }

        response = self.client.post(reverse('payments:payment'), post_data)

        # Should stay on payment page
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment.html')

        # Check for error message
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn("Expiry date is not provided or provided in wrong format", str(messages[0]))

    def test_payment_view_post_invalid_cvv(self):
        """Test payment view POST with invalid CVV"""
        post_data = {
            'card_name': 'Test User',
            'card_number': '4111 1111 1111 1111',
            'expiry_date': '12/25',
            'cvv': '12345'  # Invalid length
        }

        response = self.client.post(reverse('payments:payment'), post_data)

        # Should stay on payment page
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment.html')

        # Check for error message
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn("Cvv is not provided or provided with wrong length", str(messages[0]))

    def test_payment_view_requires_login(self):
        """Test payment view requires authentication"""
        # Logout
        self.client.logout()

        response = self.client.get(reverse('payments:payment'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login

        # Verify redirect contains login URL
        self.assertTrue(response.url.startswith('/accounts/login/'))


class PaymentSuccessViewTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create test address
        self.address = Address.objects.create(
            user=self.user,
            address_line_1='123 Test St',
            address_line_2='Apt 4B',
            city='Test City',
            state_or_province='Test State',
            country='Test Country',
            postal_code='12345',
            is_primary=True
        )

        # Create test shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create test inventory
        self.inventory = Inventory.objects.create(
            stock_count=10,
            warehouse_location='Test Location'
        )

        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            price=Decimal('99.99'),
            shop=self.shop,
            slug='test-product',
            inventory=self.inventory
        )

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            shipping_method='standard',
            shipping_cost=Decimal('5.99'),
            status='paid'
        )

        # Create test order details
        self.order_details = OrderDetails.objects.create(
            order=self.order,
            product=self.product,
            quantity=2
        )

        # Create test payment
        self.payment = Payment.objects.create(
            order=self.order,
            payment_method='debit_card',
            amount=Decimal('205.97'),
            status='paid',
            currency='USD'
        )

        # Set order id in session
        session = self.client.session
        session['new_order_id'] = self.order.pk
        session.save()

        # Login the user
        self.client.login(email='testuser@example.com', password='testpassword')

    def test_payment_success_view(self):
        """Test payment success view"""
        response = self.client.get(reverse('payments:payment_success'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'payments/payment_success.html')

        # Check context
        self.assertEqual(response.context['order_number'], self.order.pk)
        self.assertEqual(response.context['address_line_1'], '123 Test St')
        self.assertEqual(response.context['address_line_2'], 'Apt 4B')
        self.assertEqual(response.context['postal_code'], '12345')
        self.assertEqual(response.context['city'], 'Test City')
        self.assertEqual(response.context['state'], 'Test State')
        self.assertEqual(response.context['country'], 'Test Country')

        # Check delivery date is present (5 days for standard shipping)
        self.assertIsNotNone(response.context['delivery_date'])

    def test_payment_success_express_shipping(self):
        """Test payment success with express shipping"""
        # Update order to use express shipping
        self.order.shipping_method = 'express'
        self.order.save()

        response = self.client.get(reverse('payments:payment_success'))

        # Check context
        self.assertEqual(response.context['order_number'], self.order.pk)

        # Check delivery date is present (2 days for express shipping)
        self.assertIsNotNone(response.context['delivery_date'])

    def test_payment_success_requires_login(self):
        """Test payment success view requires authentication"""
        # Logout
        self.client.logout()

        response = self.client.get(reverse('payments:payment_success'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login

        # Verify redirect contains login URL
        self.assertTrue(response.url.startswith('/accounts/login/'))