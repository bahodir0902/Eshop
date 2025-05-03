from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from decimal import Decimal
from products.models import Product, Category, Inventory
from shops.models import Shop
from accounts.models import User
import os
from accounts.utils import get_random_username

class CategoryModelTest(TestCase):
    def setUp(self):
        # Create parent category
        self.parent_category = Category.objects.create(name='Electronics')

        # Create subcategories
        self.subcategory1 = Category.objects.create(
            name='Phones',
            parent_category=self.parent_category
        )

        self.subcategory2 = Category.objects.create(
            name='Laptops',
            parent_category=self.parent_category
        )

        # Create a nested subcategory
        self.nested_subcategory = Category.objects.create(
            name='Smartphones',
            parent_category=self.subcategory1
        )

    def test_category_creation(self):
        """Test category creation with attributes"""
        self.assertEqual(self.parent_category.name, 'Electronics')
        self.assertIsNone(self.parent_category.parent_category)

        self.assertEqual(self.subcategory1.name, 'Phones')
        self.assertEqual(self.subcategory1.parent_category, self.parent_category)

    def test_category_string_representation(self):
        """Test string representation of category"""
        self.assertEqual(str(self.parent_category), 'Electronics')

    def test_get_all_subcategories(self):
        """Test get_all_subcategories method"""
        subcategories = self.parent_category.get_all_subcategories()
        self.assertEqual(len(subcategories), 3)
        self.assertIn(self.subcategory1, subcategories)
        self.assertIn(self.subcategory2, subcategories)
        self.assertIn(self.nested_subcategory, subcategories)

        # Test nested subcategories
        subcategories = self.subcategory1.get_all_subcategories()
        self.assertEqual(len(subcategories), 1)
        self.assertIn(self.nested_subcategory, subcategories)


class InventoryModelTest(TestCase):
    def setUp(self):
        # Create inventory
        self.inventory = Inventory.objects.create(
            name='Main Warehouse',
            stock_count=100,
            reserved_quantity=10,
            warehouse_location='New York'
        )

    def test_inventory_creation(self):
        """Test inventory creation with attributes"""
        self.assertEqual(self.inventory.name, 'Main Warehouse')
        self.assertEqual(self.inventory.stock_count, 100)
        self.assertEqual(self.inventory.reserved_quantity, 10)
        self.assertEqual(self.inventory.warehouse_location, 'New York')

    def test_inventory_string_representation(self):
        """Test string representation of inventory"""
        self.assertEqual(str(self.inventory), 'Main Warehouse - New York')


class ProductModelTest(TestCase):
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

    def test_product_creation(self):
        """Test product creation with attributes"""
        self.assertEqual(self.product.name, 'Test Product')
        self.assertEqual(self.product.price, Decimal('99.99'))
        self.assertEqual(self.product.short_description, 'A test product')
        self.assertEqual(self.product.shop, self.shop)
        self.assertEqual(self.product.slug, 'test-product')
        self.assertEqual(self.product.category, self.category)
        self.assertEqual(self.product.inventory, self.inventory)
        self.assertTrue(self.product.is_available)
        self.assertFalse(self.product.is_discounted)
        self.assertFalse(self.product.is_featured)
        self.assertFalse(self.product.is_approved)

    def test_product_string_representation(self):
        """Test string representation of product"""
        self.assertEqual(str(self.product), 'Test Product - 99.99')

    def test_custom_manager_available_products(self):
        """Test AvailableProducts manager"""
        # Create an unavailable product
        unavailable_product = Product.objects.create(
            name='Unavailable Product',
            price=Decimal('49.99'),
            shop=self.shop,
            slug='unavailable-product',
            category=self.category,
            inventory=self.inventory,
            is_available=False
        )

        # Test manager
        available_products = Product.available_products.all()
        self.assertEqual(available_products.count(), 1)
        self.assertIn(self.product, available_products)
        self.assertNotIn(unavailable_product, available_products)

    def test_custom_manager_approved_products(self):
        """Test ApprovedProducts manager"""
        # Create an approved product
        approved_product = Product.objects.create(
            name='Approved Product',
            price=Decimal('149.99'),
            shop=self.shop,
            slug='approved-product',
            category=self.category,
            inventory=self.inventory,
            is_approved=True
        )

        # Test manager
        approved_products = Product.approved_products.all()
        self.assertEqual(approved_products.count(), 1)
        self.assertIn(approved_product, approved_products)
        self.assertNotIn(self.product, approved_products)


class ImageValidationTest(TestCase):
    def test_validate_image_size(self):
        """Test image size validation"""
        from products.models import validate_image_size

        # Create a mock file that exceeds the size limit (4MB)
        large_file = SimpleUploadedFile(
            "large_image.jpg",
            b"X" * (4 * 1024 * 1024 + 1),  # Slightly over 4MB
            content_type="image/jpeg"
        )

        # Test validation raises error
        with self.assertRaises(ValidationError):
            validate_image_size(large_file)

        # Create a mock file within the size limit
        valid_file = SimpleUploadedFile(
            "valid_image.jpg",
            b"X" * (2 * 1024 * 1024),  # 2MB
            content_type="image/jpeg"
        )

        # Should not raise an error
        try:
            validate_image_size(valid_file)
        except ValidationError:
            self.fail("validate_image_size raised ValidationError unexpectedly")

    def test_unique_image_path(self):
        """Test unique_image_path function"""
        from products.models import unique_image_path

        # Test path generation
        path = unique_image_path(None, "test_image.jpg")

        # Check path starts with product_images/
        self.assertTrue(path.startswith('product_images/'))

        # Check file extension is preserved
        self.assertTrue(path.endswith('.jpg'))