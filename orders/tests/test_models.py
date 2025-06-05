from django.test import TestCase
from orders.models import Order, OrderDetails
from accounts.models import User, Address
from products.models import Product, Inventory, Shop
from decimal import Decimal
from accounts.utils import get_random_username

class OrderModelTest(TestCase):
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
            warehouse_location='Test Location'
        )

        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            price=Decimal('99.99'),
            shop=self.shop,
            slug='test-product',
            stock_count=100,
            inventory=self.inventory
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

    def test_order_creation(self):
        """Test order is created with correct attributes"""
        self.assertEqual(self.order.user, self.user)
        self.assertEqual(self.order.shipping_address, self.address)
        self.assertEqual(self.order.status, 'pending')
        self.assertEqual(self.order.shipping_method, 'standard')
        self.assertEqual(self.order.shipping_cost, Decimal('5.99'))
        self.assertEqual(self.order.discount_code, 'None')

    def test_order_string_representation(self):
        """Test string representation of order"""
        expected_string = f'{self.user.first_name} - {self.user.email} - {self.order.status}'
        self.assertEqual(str(self.order), expected_string)

    def test_order_details_creation(self):
        """Test order details are created with correct attributes"""
        self.assertEqual(self.order_details.order, self.order)
        self.assertEqual(self.order_details.product, self.product)
        self.assertEqual(self.order_details.quantity, 2)

    def test_order_details_string_representation(self):
        """Test string representation of order details"""
        expected_string = f'{self.product.name} - {self.order_details.quantity}'
        self.assertEqual(str(self.order_details), expected_string)

    def test_order_status_choices(self):
        """Test order status choices"""
        self.order.status = 'processing'
        self.order.save()
        self.assertEqual(self.order.status, 'processing')

        self.order.status = 'delivered'
        self.order.save()
        self.assertEqual(self.order.status, 'delivered')

        # Django doesn't raise ValueError for invalid choices at the model level
        # It only enforces choices in forms and admin interfaces
        self.order.status = 'invalid_status'
        self.order.save()
        self.assertEqual(self.order.status, 'invalid_status')