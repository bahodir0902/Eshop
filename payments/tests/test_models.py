from django.test import TestCase
from payments.models import Payment
from orders.models import Order
from accounts.models import User, Address
from products.models import Product, Inventory, Shop
from decimal import Decimal
from accounts.utils import get_random_username

class PaymentModelTest(TestCase):
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

        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            shipping_address=self.address,
            shipping_method='standard',
            shipping_cost=Decimal('5.99')
        )

        # Create test payment
        self.payment = Payment.objects.create(
            order=self.order,
            payment_method='debit_card',
            amount=Decimal('105.99'),
            status='paid',
            currency='USD'
        )

    def test_payment_creation(self):
        """Test payment is created with correct attributes"""
        self.assertEqual(self.payment.order, self.order)
        self.assertEqual(self.payment.payment_method, 'debit_card')
        self.assertEqual(self.payment.amount, Decimal('105.99'))
        self.assertEqual(self.payment.status, 'paid')
        self.assertEqual(self.payment.currency, 'USD')

    def test_payment_string_representation(self):
        """Test string representation of payment"""
        expected_string = f'{self.order.pk} - {self.payment.amount} - {self.payment.status}'
        self.assertEqual(str(self.payment), expected_string)

    def test_payment_method_choices(self):
        """Test payment method choices"""
        self.payment.payment_method = 'credit_card'
        self.payment.save()
        self.assertEqual(self.payment.payment_method, 'credit_card')

        self.payment.payment_method = 'cash'
        self.payment.save()
        self.assertEqual(self.payment.payment_method, 'cash')