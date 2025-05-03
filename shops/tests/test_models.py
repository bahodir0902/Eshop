from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from decimal import Decimal
import os
from accounts.utils import get_random_username
from shops.models import Shop, validate_image_size
from accounts.models import User


class ShopModelTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create a second user
        self.user2 = User.objects.create_user(
            username=get_random_username(),
            email='testuser2@example.com',
            password='testpassword2',
            first_name='Test2',
            last_name='User2'
        )

        # Create a test image
        self.image = Image.new('RGB', (100, 100), color='red')
        self.image_io = io.BytesIO()
        self.image.save(self.image_io, format='JPEG')
        self.image_io.seek(0)
        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            self.image_io.getvalue(),
            content_type="image/jpeg"
        )

        # Create a shop
        self.shop = Shop.objects.create(
            owner=self.user,
            name='Test Shop',
            description='This is a test shop description'
        )

    def test_shop_creation(self):
        """Test shop creation with basic attributes"""
        self.assertEqual(self.shop.owner, self.user)
        self.assertEqual(self.shop.name, 'Test Shop')
        self.assertEqual(self.shop.description, 'This is a test shop description')
        # Django ImageField returns an ImageFieldFile even when empty
        # The correct way to check is:
        self.assertFalse(bool(self.shop.image))  # Check if the field is empty

    def test_shop_with_image(self):
        """Test shop creation with an image"""
        # Reset file pointer
        self.image_io.seek(0)
        shop_image = SimpleUploadedFile(
            "shop_image.jpg",
            self.image_io.getvalue(),
            content_type="image/jpeg"
        )

        shop = Shop.objects.create(
            owner=self.user2,
            name='Shop With Image',
            description='This shop has an image',
            image=shop_image
        )

        self.assertIsNotNone(shop.image)
        self.assertIn('shop_images/', shop.image.name)

    def test_shop_string_representation(self):
        """Test string representation of shop"""
        expected = f'Test Shop - This is a test shop description'
        self.assertEqual(str(self.shop), expected)

    def test_required_fields(self):
        """Test that required fields must be provided"""
        # Test missing name
        shop_without_name = Shop(
            owner=self.user,
            description='Missing name shop'
        )
        with self.assertRaises(ValidationError):
            shop_without_name.full_clean()  # This will validate the model

        # Test missing description
        shop_without_description = Shop(
            owner=self.user,
            name='Missing Description Shop'
        )
        with self.assertRaises(ValidationError):
            shop_without_description.full_clean()

        # Test missing owner
        shop_without_owner = Shop(
            name='Missing Owner Shop',
            description='This shop has no owner'
        )
        with self.assertRaises(ValidationError):
            shop_without_owner.full_clean()

    def test_field_types(self):
        """Test field types"""
        # Check name is a string
        self.assertIsInstance(self.shop.name, str)

        # Check description is a string
        self.assertIsInstance(self.shop.description, str)

    def test_unique_image_path(self):
        """Test unique_image_path function"""
        from shops.models import unique_image_path

        # Test path generation
        path = unique_image_path(None, "test_image.jpg")

        # Check path starts with shop_images/
        self.assertTrue(path.startswith('shop_images/'))

        # Check file extension is preserved
        self.assertTrue(path.endswith('.jpg'))

        # Create another path and ensure it's different
        path2 = unique_image_path(None, "test_image.jpg")
        self.assertNotEqual(path, path2)


class ImageValidationTest(TestCase):
    def setUp(self):
        # Create a small valid image
        self.image = Image.new('RGB', (100, 100), color='red')
        self.image_io = io.BytesIO()
        self.image.save(self.image_io, format='JPEG')
        self.image_io.seek(0)

        # Create a large image data (>4MB)
        self.large_image_io = io.BytesIO()
        large_data = b'x' * (4 * 1024 * 1024 + 1)  # Just over 4MB
        self.large_image_io.write(large_data)
        self.large_image_io.seek(0)

    def test_validate_image_size(self):
        """Test image size validation function"""
        # Test with valid image size
        valid_file = SimpleUploadedFile(
            "small_image.jpg",
            self.image_io.getvalue(),
            content_type="image/jpeg"
        )

        # Should not raise an error
        try:
            validate_image_size(valid_file)
        except ValidationError:
            self.fail("validate_image_size raised ValidationError for valid image size")

        # Test with oversized image
        large_file = SimpleUploadedFile(
            "large_image.jpg",
            self.large_image_io.getvalue(),
            content_type="image/jpeg"
        )

        # Should raise ValidationError
        with self.assertRaises(ValidationError):
            validate_image_size(large_file)

    def test_image_file_extension_validation(self):
        """Test file extension validation"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.core.exceptions import ValidationError

        # Create a user for the shop
        user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword'
        )

        # Create a shop with a valid image
        shop = Shop(
            owner=user,
            name='Test Shop',
            description='Test Description'
        )

        # Test valid extension
        for ext in ['jpg', 'jpeg', 'png']:
            self.image_io.seek(0)
            valid_file = SimpleUploadedFile(
                f"test_image.{ext}",
                self.image_io.getvalue(),
                content_type=f"image/{ext}"
            )
            shop.image = valid_file
            try:
                shop.full_clean()  # This calls validators
            except ValidationError:
                self.fail(f"ValidationError raised for valid extension .{ext}")

        # Test invalid extension
        invalid_file = SimpleUploadedFile(
            "test_file.txt",
            b"This is not an image",
            content_type="text/plain"
        )

        shop.image = invalid_file
        with self.assertRaises(ValidationError):
            shop.full_clean()
