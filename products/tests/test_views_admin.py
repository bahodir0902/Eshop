from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, Client
from django.urls import reverse
from products.models import Product, Category, Inventory
from shops.models import Shop
from accounts.models import User
from decimal import Decimal
from accounts.utils import get_random_username

class AdminViewsTest(TestCase):
    def setUp(self):
        # Create an admin user
        self.admin_user = User.objects.create_user(
            username=get_random_username(),
            email='admin@example.com',
            password='adminpassword',
            is_staff=True,
            is_superuser=True
        )

        # Create a shop
        self.shop = Shop.objects.create(
            owner=self.admin_user,  # Admin owns the shop for testing
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

        # Create a product
        self.product = Product.objects.create(
            name='Test Product',
            price=Decimal('99.99'),
            short_description='A test product',
            shop=self.shop,
            slug='test-product',
            category=self.category,
            inventory=self.inventory
        )

        self.client = Client()

        # Login as admin for all tests
        self.client.login(email='admin@example.com', password='adminpassword')

    def test_add_product_view_access(self):
        """Test add product view access permissions for admin"""
        url = reverse('products:add_product')

        # Admin user should have access
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'products/add_product_form.html')

    def test_add_product_view_post(self):
        """Test adding a product via POST as admin"""
        # Create a proper test image
        from PIL import Image
        import io

        # Create a small test image in memory
        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        # Create the test file
        test_image = SimpleUploadedFile(
            "test_image.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

        # Prepare form data
        form_data = {
            'name': 'New Product',
            'price': '149.99',
            'short_description': 'A new test product',
            'shop': self.shop.id,
            'slug': 'new-product',
            'category': self.category.id,
            'inventory': self.inventory.id,
            'stock_count': 50,
            'image': test_image
        }

        # Post form
        response = self.client.post(reverse('products:add_product'), form_data)

        # Check redirect on success
        self.assertEqual(response.status_code, 302)

        # Verify product was created
        self.assertTrue(Product.objects.filter(slug='new-product').exists())

    def test_edit_product_view(self):
        """Test editing a product as admin"""
        # Get the edit page
        response = self.client.get(
            reverse('products:edit_product', args=[self.product.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'products/edit_product.html')

        # Create a test image for update
        from PIL import Image
        import io

        # Create a small test image in memory
        image = Image.new('RGB', (100, 100), color='blue')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        # Create the test file
        test_image = SimpleUploadedFile(
            "updated_image.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

        # Prepare updated data
        form_data = {
            'name': 'Updated Product',
            'price': '129.99',
            'short_description': 'An updated test product',
            'shop': self.shop.id,
            'slug': 'test-product',  # Keep the same slug
            'category': self.category.id,
            'inventory': self.inventory.id,
            'stock_count': 80,
            'image': test_image
        }

        # Post form
        response = self.client.post(
            reverse('products:edit_product', args=[self.product.pk]),
            form_data
        )

        # Check redirect on success
        self.assertEqual(response.status_code, 302)

        # Verify product was updated
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Product')
        self.assertEqual(self.product.price, Decimal('129.99'))

    def test_manage_products_view(self):
        """Test manage products view for admin"""
        response = self.client.get(reverse('products:manage_products'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'products/manage_products.html')

        # Check context
        self.assertIn('products', response.context)
        self.assertIn('total_products', response.context)
        self.assertIn('total_active', response.context)
        self.assertIn('categories', response.context)

    def test_delete_product(self):
        """Test deleting a product as admin"""
        # Delete the product
        response = self.client.get(
            reverse('products:delete_product', args=[self.product.pk])
        )

        # Check redirect on success
        self.assertEqual(response.status_code, 302)

        # Verify product was deleted
        self.assertFalse(Product.objects.filter(pk=self.product.pk).exists())