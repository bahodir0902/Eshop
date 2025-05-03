from django.test import TestCase, Client, RequestFactory
from django.urls import reverse, NoReverseMatch
from django.contrib.auth import get_user_model
from accounts.models import User, CodeEmail, CodePassword, Address
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import json
from accounts.utils import get_random_username


class BaseViewTest(TestCase):
    """Base test class with helper methods for view tests"""

    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()

        # Handle products URL that might not exist in tests
        try:
            self.products_url = reverse('products:products')
        except NoReverseMatch:
            self.products_url = '/products/'

    def create_user(self, email='user@example.com', password='userpass123', **kwargs):
        """Helper method to create a user"""
        username = get_random_username()
        return User.objects.create_user(username, email=email, password=password, **kwargs)


class LoginViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.login_url = reverse('accounts:login')
        self.user = self.create_user(email='user@example.com', password='userpass123')

    def test_login_get(self):
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)

    @patch('accounts.views.authenticate')
    @patch('accounts.views.login')
    def test_login_post_success(self, mock_login, mock_authenticate):
        # Mock authentication to return our user
        mock_authenticate.return_value = self.user

        response = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'userpass123'
        })

        # Check authenticate was called
        mock_authenticate.assert_called_once()

        # Check login was called
        mock_login.assert_called_once()

        # Should redirect
        self.assertEqual(response.status_code, 302)

    @patch('accounts.views.authenticate')
    def test_login_post_invalid_credentials(self, mock_authenticate):
        # Mock authentication to fail
        mock_authenticate.return_value = None

        response = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'wrongpassword'
        })

        # Should stay on login page
        self.assertEqual(response.status_code, 200)


class RegisterViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.register_url = reverse('accounts:register')

    def test_register_get(self):
        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, 200)

    @patch('accounts.views.send_email_verification')
    def test_register_post_success(self, mock_send_email):
        data = {
            'first_name': 'New',
            'last_name': 'User',
            'email': 'new@example.com',
            'password': 'newpass123',
            're_password': 'newpass123'
        }

        response = self.client.post(
            self.register_url,
            data
        )

        self.assertEqual(response.status_code, 200)

        mock_send_email.assert_called_once()


class LogoutViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.logout_url = reverse('accounts:logout')
        self.user = self.create_user()

    @patch('accounts.views.logout')
    def test_logout(self, mock_logout):
        response = self.client.get(self.logout_url)

        # Check logout was called
        mock_logout.assert_called_once()

        # Should redirect
        self.assertEqual(response.status_code, 302)


class VerifyRegistrationViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.verify_url = reverse('accounts:verify_email')
        self.user = self.create_user(email='verify@example.com')
        self.user.is_verified_email = False
        self.user.save()

        # Create verification code
        self.code = '1234'
        self.code_email = CodeEmail.objects.create(
            email='verify@example.com',
            code=self.code
        )

    def test_verify_post_success(self):
        response = self.client.post(self.verify_url, {
            'verification_code': self.code,
            'email': 'verify@example.com'
        })

        # Check response
        self.assertEqual(response.status_code, 200)

        # Check user is now verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified_email)


class ForgotPasswordViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.forgot_url = reverse('accounts:forgot_password')
        self.user = self.create_user(email='forgot@example.com')

    def test_forgot_get(self):
        response = self.client.get(self.forgot_url)
        self.assertEqual(response.status_code, 200)

    @patch('accounts.views.send_password_verification')
    def test_forgot_post_success(self, mock_send_verification):
        response = self.client.post(self.forgot_url, {
            'email': 'forgot@example.com'
        })

        # Should redirect
        self.assertEqual(response.status_code, 302)

        # Verification should be sent
        mock_send_verification.assert_called_once()


class ProfileViewTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.profile_url = reverse('accounts:profile')
        self.user = self.create_user(
            email='profile@example.com',
            password='profilepass123'
        )

        # Create an address
        self.address = Address.objects.create(
            user=self.user,
            address_line_1='123 Test St',
            city='Test City',
            state_or_province='Test State',
            country='Test Country',
            postal_code='12345'
        )

        # Log in with email as the USERNAME_FIELD
        self.client.login(email='profile@example.com', password='profilepass123')

    def test_profile_get_authenticated(self):
        # Make sure to patch login if needed
        with patch('accounts.views.login_required', lambda x: x):
            response = self.client.get(self.profile_url)
            self.assertEqual(response.status_code, 200)


class GoogleAuthViewsTests(BaseViewTest):
    def setUp(self):
        super().setUp()
        self.google_login_url = reverse('accounts:google_login')

    @patch('accounts.views.settings')
    def test_google_login(self, mock_settings):
        # Set up mock settings
        mock_settings.GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth'
        mock_settings.GOOGLE_CLIENT_ID = 'test_client_id'
        mock_settings.GOOGLE_REDIRECT_URI = 'http://testserver/accounts/login/google/callback/'

        response = self.client.get(self.google_login_url)

        # Should redirect to Google
        self.assertEqual(response.status_code, 302)