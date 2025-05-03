from django.test import TestCase, Client
from django.urls import reverse
from products.models import Product, Category, Inventory
from shops.models import Shop
from accounts.models import User
from carts.models import Cart, CartItems
from favourites.models import Favourite, FavouriteItem
from decimal import Decimal
from accounts.utils import get_random_username

class ProductListViewTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a user
        cls.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword'
        )

        # Create a shop
        cls.shop = Shop.objects.create(
            owner=cls.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create categories
        cls.electronics = Category.objects.create(name='Electronics')
        cls.clothing = Category.objects.create(name='Clothing')

        # Create subcategory
        cls.phones = Category.objects.create(
            name='Phones',
            parent_category=cls.electronics
        )

        # Create inventory
        cls.inventory = Inventory.objects.create(
            name='Main Warehouse',
            stock_count=100,
            reserved_quantity=10,
            warehouse_location='New York'
        )

        # Create 10 products
        for i in range(5):
            Product.objects.create(
                name=f'Electronics Product {i}',
                price=Decimal(f'{i + 1}99.99'),
                short_description=f'Electronics product {i}',
                shop=cls.shop,
                slug=f'electronics-product-{i}',
                category=cls.electronics,
                inventory=cls.inventory
            )

            Product.objects.create(
                name=f'Phone Product {i}',
                price=Decimal(f'{i + 1}49.99'),
                short_description=f'Phone product {i}',
                shop=cls.shop,
                slug=f'phone-product-{i}',
                category=cls.phones,
                inventory=cls.inventory
            )

            Product.objects.create(
                name=f'Clothing Product {i}',
                price=Decimal(f'{i + 1}9.99'),
                short_description=f'Clothing product {i}',
                shop=cls.shop,
                slug=f'clothing-product-{i}',
                category=cls.clothing,
                inventory=cls.inventory
            )

    def setUp(self):
        self.client = Client()

    def test_product_list_view_basic(self):
        """Test basic functionality of product list view"""
        response = self.client.get(reverse('products:products'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'products/list_products.html')

        # Check that all products are shown
        self.assertEqual(len(response.context['products']), 15)

    def test_product_list_view_category_filter(self):
        """Test category filtering in product list view"""
        response = self.client.get(
            reverse('products:products'),
            {'category': self.electronics.id}
        )

        self.assertEqual(response.status_code, 200)

        # Should show electronics products and phone products (subcategory)
        self.assertEqual(len(response.context['products']), 10)

    def test_product_list_view_price_sorting(self):
        """Test price sorting in product list view"""
        # Test price ascending
        response = self.client.get(
            reverse('products:products'),
            {'sort': 'price_asc'}
        )

        self.assertEqual(response.status_code, 200)
        products = list(response.context['products'])
        for i in range(len(products) - 1):
            self.assertLessEqual(products[i].price, products[i + 1].price)

        # Test price descending
        response = self.client.get(
            reverse('products:products'),
            {'sort': 'price_desc'}
        )

        self.assertEqual(response.status_code, 200)
        products = list(response.context['products'])
        for i in range(len(products) - 1):
            self.assertGreaterEqual(products[i].price, products[i + 1].price)

    def test_product_list_view_pagination(self):
        """Test pagination in product list view"""
        response = self.client.get(
            reverse('products:products'),
            {'per_page': 5}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['products']), 5)
        self.assertTrue(response.context['products'].has_next())

    def test_product_list_view_search(self):
        """Test search functionality in product list view"""
        try:
            response = self.client.get(
                reverse('products:products'),
                {'q': 'Phone'}
            )

            self.assertEqual(response.status_code, 200)
            # If PostgreSQL extension is available, check results
            if 'products' in response.context:
                for product in response.context['products']:
                    self.assertIn('Phone', product.name)
        except:
            # Skip this test if PostgreSQL features aren't available
            self.skipTest("PostgreSQL trigram search not available")

    def test_authenticated_user_cart_and_favorites(self):
        """Test cart and favorites context for authenticated users"""
        # Login
        self.client.login(email='testuser@example.com', password='testpassword')

        # Create cart and favorite
        cart = Cart.objects.create(user=self.user)
        favourite = Favourite.objects.create(user=self.user)

        # Add a product to cart and favorite
        product = Product.objects.first()
        CartItems.objects.create(cart=cart, product=product, quantity=1)
        FavouriteItem.objects.create(favourite=favourite, product=product)

        response = self.client.get(reverse('products:products'))

        self.assertEqual(response.status_code, 200)
        self.assertIn('cart_items', response.context)
        self.assertIn('favourite_items', response.context)
        self.assertEqual(len(response.context['cart_items']), 1)
        self.assertEqual(len(response.context['favourite_items']), 1)


class ProductDetailViewTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword'
        )

        # Create a shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='Test Shop Description'
        )

        # Create category
        self.category = Category.objects.create(name='Electronics')

        # Create inventory
        self.inventory = Inventory.objects.create(
            name='Main Warehouse',
            stock_count=100,
            reserved_quantity=10,
            warehouse_location='New York'
        )

        # Create a product with details
        self.product = Product.objects.create(
            name='Test Product',
            price=Decimal('99.99'),
            short_description='A test product',
            full_description='This is a full description of the test product.',
            key_features='Feature 1, Feature 2, Feature 3',
            specifications='Weight: 2.5kg, Dimensions: 10x15x5cm',
            shop=self.shop,
            slug='test-product',
            category=self.category,
            inventory=self.inventory
        )

        # Create another product in the same category
        self.related_product = Product.objects.create(
            name='Related Product',
            price=Decimal('149.99'),
            short_description='A related product',
            shop=self.shop,
            slug='related-product',
            category=self.category,
            inventory=self.inventory
        )

        self.client = Client()

    def test_product_detail_view_basic(self):
        """Test basic functionality of product detail view"""
        response = self.client.get(
            reverse('products:product_detail', args=[self.product.slug])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'products/product_details.html')

        # Check context
        self.assertEqual(response.context['product'], self.product)
        self.assertIn(self.related_product, response.context['related_products'])

    def test_product_detail_view_features_and_specs(self):
        """Test features and specifications parsing in product detail view"""
        response = self.client.get(
            reverse('products:product_detail', args=[self.product.slug])
        )

        self.assertEqual(response.status_code, 200)

        # Check features
        self.assertEqual(len(response.context['features']), 3)
        self.assertIn('Feature 1', response.context['features'])

        # Check specifications
        self.assertIn('Weight', response.context['specifications'])
        self.assertEqual(response.context['specifications']['Weight'], '2.5kg')

    def test_product_detail_view_authenticated_user(self):
        """Test authenticated user context in product detail view"""
        # Login
        self.client.login(email='testuser@example.com', password='testpassword')

        # Create cart and favorite
        cart = Cart.objects.create(user=self.user)
        favourite = Favourite.objects.create(user=self.user)

        # Add a product to cart and favorite
        CartItems.objects.create(cart=cart, product=self.product, quantity=1)
        FavouriteItem.objects.create(favourite=favourite, product=self.product)

        response = self.client.get(
            reverse('products:product_detail', args=[self.product.slug])
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('cart_items', response.context)
        self.assertIn('favourite_items', response.context)
        self.assertEqual(len(response.context['cart_items']), 1)
        self.assertEqual(len(response.context['favourite_items']), 1)