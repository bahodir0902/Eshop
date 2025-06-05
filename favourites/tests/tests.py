from django.test import TestCase, Client
from django.urls import reverse, resolve
from accounts.models import User
from products.models import Product, Category, Inventory
from shops.models import Shop
from favourites.models import Favourite, FavouriteItem
from favourites.views import FavouriteView, AddFavouriteItem, RemoveFavouriteItem, ClearFavourites
import json
from accounts.utils import get_random_username

class FavouriteModelTests(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword'
        )

        # Create shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create inventory
        self.inventory = Inventory.objects.create(
            warehouse_location='Test Location'
        )

        # Create product
        self.product = Product.objects.create(
            name='Test Product',
            price=100.00,
            shop=self.shop,
            slug='test-product',
            stock_count=100,
            inventory=self.inventory
        )

        # Create favourite
        self.favourite = Favourite.objects.create(
            user=self.user
        )

    def test_favourite_creation(self):
        self.assertEqual(str(self.favourite), f"Favourite list of {self.user.first_name} - {self.user.last_name}")

    def test_favourite_item_creation(self):
        favourite_item = FavouriteItem.objects.create(
            favourite=self.favourite,
            product=self.product
        )
        self.assertEqual(str(favourite_item), f'favourite items {self.product.name} in {self.favourite}')


class FavouriteViewTests(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword'
        )

        # Create shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create inventory
        self.inventory = Inventory.objects.create(
            warehouse_location='Test Location'
        )

        # Create product
        self.product = Product.objects.create(
            name='Test Product',
            price=100.00,
            shop=self.shop,
            slug='test-product',
            stock_count=100,
            inventory=self.inventory
        )

        # Create favourite
        self.favourite = Favourite.objects.create(
            user=self.user
        )

        # Login
        self.client.login(email='test@example.com', password='testpassword')

    def test_favourite_view(self):
        # Test that the view returns a 200 OK response
        response = self.client.get(reverse('favourites:favourites'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'favourites/favourites.html')

    def test_add_favourite_item(self):
        # Test adding a favourite item
        response = self.client.post(reverse('favourites:add_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify the item was added
        favourite_item = FavouriteItem.objects.filter(favourite=self.favourite, product=self.product)
        self.assertTrue(favourite_item.exists())

    def test_remove_favourite_item(self):
        # First add an item
        FavouriteItem.objects.create(
            favourite=self.favourite,
            product=self.product
        )

        # Then test removing it
        response = self.client.post(reverse('favourites:remove_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify the item was removed
        favourite_item = FavouriteItem.objects.filter(favourite=self.favourite, product=self.product)
        self.assertFalse(favourite_item.exists())

    def test_clear_favourites(self):
        # First add an item
        FavouriteItem.objects.create(
            favourite=self.favourite,
            product=self.product
        )

        # Then test clearing all
        response = self.client.post(reverse('favourites:clear_favourites'))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify all items were removed
        favourite_items = FavouriteItem.objects.filter(favourite=self.favourite)
        self.assertEqual(favourite_items.count(), 0)

    def test_add_duplicate_item(self):
        # Add an item
        FavouriteItem.objects.create(
            favourite=self.favourite,
            product=self.product
        )

        # Try to add the same item again
        response = self.client.post(reverse('favourites:add_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify there's still only one item
        favourite_items = FavouriteItem.objects.filter(favourite=self.favourite, product=self.product)
        self.assertEqual(favourite_items.count(), 1)


class FavouriteViewEdgeCaseTests(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='test@example.com',
            password='testpassword'
        )

        # Create shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create inventory
        self.inventory = Inventory.objects.create(
            warehouse_location='Test Location'
        )

        # Create product
        self.product = Product.objects.create(
            name='Test Product',
            price=100.00,
            shop=self.shop,
            slug='test-product',
            stock_count=100,
            inventory=self.inventory
        )

        # Login
        self.client.login(email='test@example.com', password='testpassword')

    def test_add_to_non_existing_favourite(self):
        # Test adding to a non-existing favourite (should create one)
        response = self.client.post(reverse('favourites:add_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify a favourite was created
        favourite = Favourite.objects.filter(user=self.user)
        self.assertTrue(favourite.exists())

        # Verify the item was added
        favourite_item = FavouriteItem.objects.filter(favourite=favourite.first(), product=self.product)
        self.assertTrue(favourite_item.exists())

    def test_add_non_existing_product(self):
        # Test adding a non-existing product
        response = self.client.post(reverse('favourites:add_favourite_item', args=[999]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Invalid product id')

    def test_remove_non_existing_product(self):
        # Create a favourite for the user first
        # This fixes the test because in the view, it checks for favourite before checking product
        favourite = Favourite.objects.create(user=self.user)

        # Test removing a non-existing product
        response = self.client.post(reverse('favourites:remove_favourite_item', args=[999]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Invalid product id')

    def test_no_favourite_error(self):
        # Test removing an item when no favourite exists
        # Don't create a favourite for this test
        response = self.client.post(reverse('favourites:remove_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Invalid user id. Perhaps you need to login.')

    def test_authentication_required(self):
        # Logout
        self.client.logout()

        # Test accessing favourite view without authentication
        response = self.client.get(reverse('favourites:favourites'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login page

        # Test adding an item without authentication
        response = self.client.post(reverse('favourites:add_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 302)  # Should redirect to login page

        # Test removing an item without authentication
        response = self.client.post(reverse('favourites:remove_favourite_item', args=[self.product.pk]))
        self.assertEqual(response.status_code, 302)  # Should redirect to login page

        # Test clearing favourites without authentication
        response = self.client.post(reverse('favourites:clear_favourites'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login page


class FavouriteURLTests(TestCase):
    def test_favourites_url_resolves(self):
        url = reverse('favourites:favourites')
        self.assertEqual(resolve(url).func.view_class, FavouriteView)

    def test_add_favourite_item_url_resolves(self):
        url = reverse('favourites:add_favourite_item', args=[1])
        self.assertEqual(resolve(url).func.view_class, AddFavouriteItem)

    def test_remove_favourite_item_url_resolves(self):
        url = reverse('favourites:remove_favourite_item', args=[1])
        self.assertEqual(resolve(url).func.view_class, RemoveFavouriteItem)

    def test_clear_favourites_url_resolves(self):
        url = reverse('favourites:clear_favourites')
        self.assertEqual(resolve(url).func.view_class, ClearFavourites)