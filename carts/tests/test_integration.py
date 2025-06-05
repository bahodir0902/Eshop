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


class CartIntegrationTest(TestCase):
    """Integration tests for cart functionality"""

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

        # Create test products
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

        self.product3 = Product.objects.create(
            name='Product 3',
            price=Decimal('150.00'),
            slug='product-3',
            stock_count=100,
            inventory=self.inventory,
            category=self.category,
            is_available=True,
            shop=self.shop
        )

        # Set up the client
        self.client = Client()
        self.client.login(email='test@example.com', password='testpassword')

    def test_complete_cart_workflow(self):
        """Test the complete cart workflow from adding items to clearing cart"""
        # Step 1: Add first item to cart
        add_url1 = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})
        response1 = self.client.post(add_url1, {'quantity': 2})
        data1 = json.loads(response1.content)
        self.assertTrue(data1['success'])

        # Step 2: Add second item to cart
        add_url2 = reverse('cart:add_cart_item', kwargs={'pk': self.product2.id})
        response2 = self.client.post(add_url2, {'quantity': 1})
        data2 = json.loads(response2.content)
        self.assertTrue(data2['success'])

        # Step 3: Verify cart contents
        cart_view_url = reverse('cart:list')
        response3 = self.client.get(cart_view_url)
        self.assertEqual(response3.status_code, 200)
        self.assertEqual(len(response3.context['cart_items']), 2)

        # Check cart item count
        cart = Cart.objects.get(user=self.user)
        self.assertEqual(CartItems.objects.filter(cart=cart).count(), 2)
        self.assertEqual(CartItems.objects.get(cart=cart, product=self.product1).quantity, 2)
        self.assertEqual(CartItems.objects.get(cart=cart, product=self.product2).quantity, 1)

        # Step 4: Update cart item quantity
        update_url = reverse('cart:update_cart_item', kwargs={'pk': self.product1.id})
        response4 = self.client.post(update_url, {'quantity': 3})
        data4 = json.loads(response4.content)
        self.assertTrue(data4['success'])

        # Verify updated quantity
        self.assertEqual(CartItems.objects.get(cart=cart, product=self.product1).quantity, 3)

        # Step 5: Remove an item from cart
        remove_url = reverse('cart:remove_cart_item', kwargs={'pk': self.product2.id})
        response5 = self.client.post(remove_url)
        data5 = json.loads(response5.content)
        self.assertTrue(data5['success'])

        # Verify product2 was removed
        self.assertEqual(CartItems.objects.filter(cart=cart).count(), 1)
        self.assertFalse(CartItems.objects.filter(cart=cart, product=self.product2).exists())

        # Step 6: Clear the cart
        clear_url = reverse('cart:clear_cart')
        response6 = self.client.post(clear_url)
        data6 = json.loads(response6.content)
        self.assertTrue(data6['success'])

        # Verify cart was cleared
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)
        self.assertEqual(CartItems.objects.filter(cart__user=self.user).count(), 0)

    def test_cart_persistence_across_sessions(self):
        """Test that cart data persists across different sessions"""
        # Add item to cart
        add_url = reverse('cart:add_cart_item', kwargs={'pk': self.product1.id})
        self.client.post(add_url, {'quantity': 2})

        # Verify cart was created
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 1)
        self.assertEqual(CartItems.objects.filter(cart__user=self.user).count(), 1)

        # Logout
        self.client.logout()

        # Login again
        self.client.login(email='test@example.com', password='testpassword')

        # Verify cart still exists
        cart_view_url = reverse('cart:list')
        response = self.client.get(cart_view_url)
        self.assertEqual(response.status_code, 200)

        # Check cart items are still there
        self.assertEqual(CartItems.objects.filter(cart__user=self.user).count(), 1)
        cart_item = CartItems.objects.get(cart__user=self.user, product=self.product1)
        self.assertEqual(cart_item.quantity, 2)