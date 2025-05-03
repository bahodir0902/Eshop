from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from products.forms import AddProductModelForm, UpdateProductModelForm
from products.models import Product, Category, Inventory
from shops.models import Shop
from accounts.models import User
from decimal import Decimal
from accounts.utils import get_random_username

class ProductFormTest(TestCase):
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

        # Create valid form data
        self.valid_form_data = {
            'name': 'New Product',
            'price': '149.99',
            'short_description': 'A new test product',
            'full_description': 'This is a detailed description of the new product.',
            'key_features': 'Feature 1, Feature 2, Feature 3',
            'specifications': 'Weight: 2.5kg, Dimensions: 10x15x5cm',
            'slug': 'new-product',
            'category': self.category.id,
            'inventory': self.inventory.id,
            'shop': self.shop.id,
            'stock_count': 50,
            'is_available': True,
            'is_discounted': False,
            'is_featured': True
        }

        # Create a simple mock image
        self.image = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )

    def test_add_product_form_valid(self):
        """Test AddProductModelForm with valid data"""
        form_data = self.valid_form_data.copy()

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

        # Test form with valid image
        form = AddProductModelForm(data=form_data, files={'image': test_image})

        self.assertTrue(form.is_valid(), f"Form errors: {form.errors}")

    def test_add_product_form_invalid(self):
        """Test AddProductModelForm with invalid data"""
        # Missing required fields
        form_data = {
            'name': '',  # Empty name (required)
            'price': 'abc',  # Invalid price
        }

        form = AddProductModelForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('name', form.errors)
        self.assertIn('price', form.errors)

    def test_add_product_form_specifications_validation(self):
        """Test specifications field validation"""
        # Invalid specifications format
        form_data = self.valid_form_data.copy()
        form_data['specifications'] = 'Invalid format without colon'

        form = AddProductModelForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('specifications', form.errors)

    def test_update_product_form_valid(self):
        """Test UpdateProductModelForm with valid data"""
        form_data = self.valid_form_data.copy()
        form = UpdateProductModelForm(data=form_data, instance=self.product)

        self.assertTrue(form.is_valid())

    def test_update_product_form_stock_count_initial(self):
        """Test stock_count initial value in UpdateProductModelForm"""
        form = UpdateProductModelForm(instance=self.product)
        self.assertEqual(form.fields['stock_count'].initial, 100)