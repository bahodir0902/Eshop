from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from decimal import Decimal
from reviews.models import FeedBack
from products.models import Product, Inventory, Category
from shops.models import Shop
from accounts.models import User
from accounts.utils import get_random_username

class FeedBackModelTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
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
            stock_count=100,
            inventory=self.inventory
        )

        # Create a feedback
        self.feedback = FeedBack.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='This is a test comment',
            is_anonymous=False
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

    def test_feedback_creation(self):
        """Test feedback creation with valid attributes"""
        self.assertEqual(self.feedback.user, self.user)
        self.assertEqual(self.feedback.product, self.product)
        self.assertEqual(self.feedback.rating, 4)
        self.assertEqual(self.feedback.comment, 'This is a test comment')
        self.assertFalse(self.feedback.is_anonymous)
        self.assertFalse(self.feedback.is_deleted)

    def test_feedback_string_representation(self):
        """Test string representation of feedback"""
        expected = f'{self.user.first_name} - {self.user.first_name} - 4 - This is a test comment'
        self.assertEqual(str(self.feedback), expected)

    def test_feedback_with_image(self):
        """Test feedback with image"""
        feedback = FeedBack.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='Feedback with image',
            image=self.test_image
        )

        self.assertTrue(feedback.image)
        self.assertIn('feedback_images/', feedback.image.name)

    def test_rating_validator(self):
        """Test rating validator"""
        # Test invalid ratings
        with self.assertRaises(ValidationError):
            feedback = FeedBack(
                user=self.user,
                product=self.product,
                rating=6,  # Invalid: > 5
                comment='Invalid rating'
            )
            feedback.full_clean()

        with self.assertRaises(ValidationError):
            feedback = FeedBack(
                user=self.user,
                product=self.product,
                rating=-1,  # Invalid: < 0
                comment='Invalid rating'
            )
            feedback.full_clean()

        # Test valid ratings (1-5)
        for rating in range(1, 6):
            feedback = FeedBack(
                user=self.user,
                product=self.product,
                rating=rating,
                comment=f'Valid rating {rating}'
            )
            try:
                feedback.full_clean()
            except ValidationError:
                self.fail(f"ValidationError raised for valid rating {rating}")


class ImageValidationTest(TestCase):
    def setUp(self):
        # Create a small valid image
        self.image = Image.new('RGB', (100, 100), color='red')
        self.image_io = io.BytesIO()
        self.image.save(self.image_io, format='JPEG')
        self.image_io.seek(0)

        # Create a large invalid image (>4MB)
        self.large_image_io = io.BytesIO()
        large_data = b'x' * (4 * 1024 * 1024 + 1)  # Just over 4MB
        self.large_image_io.write(large_data)
        self.large_image_io.seek(0)

    def test_validate_image_size(self):
        """Test image size validation"""
        from reviews.models import validate_image_size

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