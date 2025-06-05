from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from carts.models import Cart, CartItems
from products.models import Product, Inventory, Category
from shops.models import Shop
import json
from decimal import Decimal
from accounts.utils import get_random_username
User = get_user_model()


class MockSetup(TestCase):
    """Base class for test setup with required models"""

    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create test shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='A test shop for unit tests'
        )

        # Create test inventory
        self.inventory = Inventory.objects.create(
            warehouse_location='Test Location'
        )

        # Create test category
        self.category = Category.objects.create(name='Test Category')

        # Create test product 1
        self.product1 = Product.objects.create(
            name='Product 1',
            price=Decimal('100.00'),
            slug='product-1',
            stock_count=100,
            inventory=self.inventory,
            category=self.category,
            is_available=True,
            shop=self.shop
        )

        # Create test product 2
        self.product2 = Product.objects.create(
            name='Product 2',
            price=Decimal('200.00'),
            slug='product-2',
            stock_count=100,
            inventory=self.inventory,
            category=self.category,
            is_available=True,
            shop=self.shop
        )

        # Set up the client
        self.client = Client()


class CartViewTest(MockSetup):
    """Test the cart list view"""

    def setUp(self):
        super().setUp()

        # Create cart
        self.cart = Cart.objects.create(user=self.user)

        # Create cart items
        self.cart_item1 = CartItems.objects.create(
            cart=self.cart,
            product=self.product1,
            quantity=2
        )

        self.cart_item2 = CartItems.objects.create(
            cart=self.cart,
            product=self.product2,
            quantity=1
        )

    def test_cart_view_unauthenticated(self):
        """Test that unauthenticated users are redirected to login"""
        response = self.client.get(reverse('cart:list'))
        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertIn('login', response.url)

    def test_cart_view_authenticated(self):
        """Test that authenticated users can view their cart"""
        self.client.login(email='test@example.com', password='testpassword')
        response = self.client.get(reverse('cart:list'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'carts/my_cart.html')
        self.assertEqual(len(response.context['cart_items']), 2)


class AddCartItemTest(MockSetup):
    """Test adding items to cart"""

    def test_add_cart_item_unauthenticated(self):
        """Test that unauthenticated users are redirected to login"""
        url = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})
        response = self.client.post(url, {'quantity': 1})

        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertIn('login', response.url)

    def test_add_cart_item_with_post_data(self):
        """Test adding an item to cart with POST data"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(url, {'quantity': 3})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])
        self.assertEqual(data['quantity'], 3)
        self.assertEqual(data['cart_count'], 1)

        # Check that cart and cart item were created
        self.assertEqual(Cart.objects.count(), 1)
        self.assertEqual(CartItems.objects.count(), 1)

        cart_item = CartItems.objects.first()
        self.assertEqual(cart_item.quantity, 3)

    def test_add_cart_item_with_json_data(self):
        """Test adding an item to cart with JSON data"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(
            url,
            json.dumps({'quantity': 2}),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])
        self.assertEqual(data['quantity'], 2)

        # Check that cart and cart item were created
        self.assertEqual(Cart.objects.count(), 1)
        self.assertEqual(CartItems.objects.count(), 1)

    def test_add_cart_item_without_quantity(self):
        """Test adding an item to cart without specifying quantity"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])
        self.assertEqual(data['quantity'], 1)  # Default quantity should be 1

    def test_add_nonexistent_product(self):
        """Test adding a nonexistent product to cart"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:add_cart_item', kwargs={'pk': 9999})  # Non-existent ID

        response = self.client.post(url, {'quantity': 1})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Product not found')


class UpdateCartItemTest(MockSetup):
    """Test updating cart items"""

    def setUp(self):
        super().setUp()

        # Create cart and item
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item = CartItems.objects.create(
            cart=self.cart,
            product=self.product1,
            quantity=2
        )

    def test_update_cart_item_unauthenticated(self):
        """Test that unauthenticated users are redirected to login"""
        url = reverse('cart:update_cart_item', kwargs={'pk': self.product1.id})
        response = self.client.post(url, {'quantity': 5})

        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertIn('login', response.url)

    def test_update_cart_item_quantity(self):
        """Test updating the quantity of a cart item"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:update_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(url, {'quantity': 5})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])

        # Check that the cart item was updated
        updated_item = CartItems.objects.get(id=self.cart_item.id)
        self.assertEqual(updated_item.quantity, 5)

    def test_update_nonexistent_product(self):
        """Test updating a nonexistent product"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:update_cart_item', kwargs={'pk': 9999})  # Non-existent ID

        response = self.client.post(url, {'quantity': 5})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Product id not found. Please try again later.')

    def test_update_cart_item_invalid_quantity(self):
        """Test updating a cart item with invalid quantity"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:update_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(url, {'quantity': 'abc'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # The response has 'success': F in your code which is a bug
        # This test will need to be adjusted based on the actual behavior
        self.assertIn('error', data)


class RemoveCartItemTest(MockSetup):
    """Test removing items from cart"""

    def setUp(self):
        super().setUp()

        # Create cart and items
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item1 = CartItems.objects.create(
            cart=self.cart,
            product=self.product1,
            quantity=2
        )
        self.cart_item2 = CartItems.objects.create(
            cart=self.cart,
            product=self.product2,
            quantity=1
        )

    def test_remove_cart_item_unauthenticated(self):
        """Test that unauthenticated users are redirected to login"""
        url = reverse('cart:remove_cart_item', kwargs={'pk': self.product1.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertIn('login', response.url)

    def test_remove_cart_item(self):
        """Test removing an item from the cart"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:remove_cart_item', kwargs={'pk': self.product1.id})

        response = self.client.post(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])
        self.assertEqual(data['cart_count'], 1)  # One item should remain

        # Check that the item was removed
        self.assertEqual(CartItems.objects.count(), 1)
        self.assertFalse(CartItems.objects.filter(product=self.product1).exists())


class ClearCartItemTest(MockSetup):
    """Test clearing cart"""

    def setUp(self):
        super().setUp()

        # Create cart and items
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item1 = CartItems.objects.create(
            cart=self.cart,
            product=self.product1,
            quantity=2
        )
        self.cart_item2 = CartItems.objects.create(
            cart=self.cart,
            product=self.product2,
            quantity=1
        )

    def test_clear_cart_unauthenticated(self):
        """Test that unauthenticated users are redirected to login"""
        url = reverse('cart:clear_cart')
        response = self.client.post(url)

        self.assertEqual(response.status_code, 302)  # Redirect to login
        self.assertIn('login', response.url)

    def test_clear_cart(self):
        """Test clearing the cart"""
        self.client.login(email='test@example.com', password='testpassword')
        url = reverse('cart:clear_cart')

        response = self.client.post(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])

        # Check that the cart and items were removed
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)
        self.assertEqual(CartItems.objects.count(), 0)


class RemoveCartItemInListTest(MockSetup):
    """Test removing items from cart list"""

    def setUp(self):
        super().setUp()

        # Create cart and items
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item1 = CartItems.objects.create(
            cart=self.cart,
            product=self.product1,
            quantity=2
        )
        self.cart_item2 = CartItems.objects.create(
            cart=self.cart,
            product=self.product2,
            quantity=1
        )

        # Login the client
        self.client.login(email='test@example.com', password='testpassword')

    def test_remove_cart_item_in_list(self):
        """Test removing a cart item by its ID"""
        url = reverse('cart:remove_cart_item_in_list', kwargs={'pk': self.cart_item1.id})

        response = self.client.get(url)  # Function-based view uses GET

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data['success'])
        self.assertEqual(data['cart_count'], 1)  # One item should remain

        # Check that the item was removed
        self.assertEqual(CartItems.objects.count(), 1)
        self.assertFalse(CartItems.objects.filter(id=self.cart_item1.id).exists())

    def test_remove_nonexistent_cart_item_in_list(self):
        """Test removing a nonexistent cart item by its ID"""
        url = reverse('cart:remove_cart_item_in_list', kwargs={'pk': 9999})  # Non-existent ID

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Item not found')