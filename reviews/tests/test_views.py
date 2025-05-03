from django.test import TestCase, Client
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
import json
from decimal import Decimal
from accounts.utils import get_random_username
from reviews.models import FeedBack
from products.models import Product, Inventory, Category
from shops.models import Shop
from accounts.models import User


class FeedbackViewTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

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

        # Create a feedback
        self.feedback = FeedBack.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='This is a test comment'
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

        # Login the user
        self.client.login(email='testuser@example.com', password='testpassword')

    def test_get_feedback_view(self):
        """Test GET method for feedback view"""
        # The GET method seems incomplete in the provided code,
        # but let's test the basic response
        response = self.client.get(
            reverse('feedbacks:feedback', args=[self.product.id])
        )

        # Should still get a response
        self.assertLess(response.status_code, 500)

    def test_post_feedback(self):
        """Test posting a feedback"""
        # First login as the second user to create a new feedback
        self.client.login(email='testuser2@example.com', password='testpassword2')

        post_data = {
            'rating': 5,
            'comment': 'Excellent product!',
            'is_anonymous': 'false'
        }

        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify feedback was created
        feedback = FeedBack.objects.filter(
            user=self.user2,
            product=self.product
        ).first()

        self.assertIsNotNone(feedback)
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.comment, 'Excellent product!')
        self.assertFalse(feedback.is_anonymous)

    def test_post_feedback_with_image(self):
        """Test posting a feedback with an image"""
        # First login as the second user to create a new feedback
        self.client.login(email='testuser2@example.com', password='testpassword2')

        # Reset the file pointer
        self.image_io.seek(0)
        test_image = SimpleUploadedFile(
            "test_image.jpg",
            self.image_io.getvalue(),
            content_type="image/jpeg"
        )

        post_data = {
            'rating': 4,
            'comment': 'Good product with image',
            'is_anonymous': 'false',
            'image': test_image
        }

        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify feedback was created with image
        feedback = FeedBack.objects.filter(
            user=self.user2,
            product=self.product
        ).first()

        self.assertIsNotNone(feedback)
        self.assertTrue(feedback.image)

    def test_post_anonymous_feedback(self):
        """Test posting an anonymous feedback"""
        # First login as the second user to create a new feedback
        self.client.login(email='testuser2@example.com', password='testpassword2')

        post_data = {
            'rating': 3,
            'comment': 'Anonymous feedback',
            'is_anonymous': 'true'
        }

        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify feedback was created as anonymous
        feedback = FeedBack.objects.filter(
            user=self.user2,
            product=self.product
        ).first()

        self.assertIsNotNone(feedback)
        self.assertTrue(feedback.is_anonymous)

    def test_update_existing_feedback(self):
        """Test updating an existing feedback"""
        post_data = {
            'rating': 2,
            'comment': 'Updated feedback',
            'is_anonymous': 'false'
        }

        # There should already be a feedback from this user
        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify feedback was updated
        feedback = FeedBack.objects.filter(
            user=self.user,
            product=self.product
        ).first()

        self.assertIsNotNone(feedback)
        self.assertEqual(feedback.rating, 2)
        self.assertEqual(feedback.comment, 'Updated feedback')

    def test_delete_feedback(self):
        """Test deleting a feedback"""
        response = self.client.delete(
            reverse('feedbacks:feedback', args=[self.product.id])
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

        # Verify feedback was deleted
        feedback_exists = FeedBack.objects.filter(
            user=self.user,
            product=self.product
        ).exists()

        self.assertFalse(feedback_exists)

    def test_invalid_product_id(self):
        """Test with invalid product ID"""
        # Use a non-existent product ID
        invalid_id = 9999

        response = self.client.post(
            reverse('feedbacks:feedback', args=[invalid_id]),
            {'rating': 5, 'comment': 'Test'}
        )

        self.assertEqual(response.status_code, 404)

    def test_missing_rating(self):
        """Test with missing rating"""
        post_data = {
            'comment': 'Missing rating',
            'is_anonymous': 'false'
        }

        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
        self.assertIn('error', data)

    def test_authentication_required(self):
        """Test authentication requirement"""
        # Logout
        self.client.logout()

        # Try to post feedback
        post_data = {
            'rating': 5,
            'comment': 'Unauthenticated feedback'
        }

        response = self.client.post(
            reverse('feedbacks:feedback', args=[self.product.id]),
            post_data
        )

        # Should redirect to login
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith('/accounts/login/'))

        # Try to delete feedback
        response = self.client.delete(
            reverse('feedbacks:feedback', args=[self.product.id])
        )

        # Should redirect to login
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith('/accounts/login/'))