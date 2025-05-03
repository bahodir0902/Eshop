from django.test import TestCase
from django.utils import timezone
from orders.models import Order
from accounts.models import User, Address
from products.models import Product, Inventory, Shop
from payments.models import Payment
from notifications.models import Notifications
from decimal import Decimal
from accounts.utils import get_random_username

class OrderSignalsTest(TestCase):
    def setUp(self):
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

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            shipping_method='standard',
            shipping_cost=Decimal('5.99')
        )

    def test_payment_notification_signal(self):
        """Test notification is created when payment is successful"""
        # Initial count of notifications
        initial_count = Notifications.objects.count()

        # Create a payment with status 'paid'
        payment = Payment.objects.create(
            order=self.order,
            amount=Decimal('105.98'),  # Product price + shipping
            payment_method='credit_card',
            status='paid'
        )

        # Check if a notification was created
        self.assertEqual(Notifications.objects.count(), initial_count + 1)

        # Check the notification details
        notification = Notifications.objects.latest('created_at')
        self.assertEqual(notification.to_user, self.user)
        self.assertEqual(notification.title, "Congratulations with successful payment")
        self.assertIn(f"Order #{self.order.pk}", notification.message)
        self.assertFalse(notification.is_read)

    def test_payment_notification_signal_not_paid(self):
        """Test notification is not created when payment is not successful"""
        # Initial count of notifications
        initial_count = Notifications.objects.count()

        # Create a payment with status not 'paid'
        payment = Payment.objects.create(
            order=self.order,
            amount=Decimal('105.98'),  # Product price + shipping
            payment_method='credit_card',
            status='pending'
        )

        # Check that no notification was created
        self.assertEqual(Notifications.objects.count(), initial_count)