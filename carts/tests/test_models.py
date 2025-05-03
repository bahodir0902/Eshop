from django.test import TestCase
from django.contrib.auth import get_user_model
from carts.models import Cart, CartItems
from products.models import Product, Inventory, Category
from shops.models import Shop
from django.core.exceptions import ValidationError
from accounts.utils import get_random_username
User = get_user_model()


class CartModelTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create a test cart
        self.cart = Cart.objects.create(user=self.user)

    def test_cart_creation(self):
        """Test that a cart can be created successfully"""
        self.assertEqual(Cart.objects.count(), 1)
        self.assertEqual(self.cart.user, self.user)

    def test_cart_string_representation(self):
        """Test the string representation of the Cart model"""
        self.assertEqual(str(self.cart), self.user.first_name)


class CartItemsModelTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create a test shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='A test shop for unit tests'
        )

        # Create a test category
        self.category = Category.objects.create(name='Test Category')

        # Create a test inventory
        self.inventory = Inventory.objects.create(
            name='Test Inventory',
            stock_count=10,
            warehouse_location='Test Location'
        )

        # Create a test product with required shop
        self.product = Product.objects.create(
            name='Test Product',
            price=100.00,
            slug='test-product',
            inventory=self.inventory,
            shop=self.shop,
            category=self.category
        )

        # Create a test cart
        self.cart = Cart.objects.create(user=self.user)

        # Create a test cart item
        self.cart_item = CartItems.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )

    def test_cart_item_creation(self):
        """Test that a cart item can be created successfully"""
        self.assertEqual(CartItems.objects.count(), 1)
        self.assertEqual(self.cart_item.cart, self.cart)
        self.assertEqual(self.cart_item.product, self.product)
        self.assertEqual(self.cart_item.quantity, 2)

    def test_cart_item_string_representation(self):
        """Test the string representation of the CartItems model"""
        expected_str = f'{self.product.name} - {self.cart_item.quantity}'
        self.assertEqual(str(self.cart_item), expected_str)

    def test_cart_item_relationships(self):
        """Test the relationships between CartItems, Cart, and Product"""
        self.assertEqual(self.cart_item.cart.user, self.user)
        self.assertEqual(self.cart_item.product.name, 'Test Product')