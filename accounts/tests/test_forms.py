from django.test import TestCase
from accounts.forms import (
    UserLoginForm, UserRegisterForm, UserForgotPasswordForm,
    UserProfileForm, UserAddressForm
)
from accounts.models import User
from accounts.utils import get_random_username


class UserLoginFormTests(TestCase):
    def test_form_valid_data(self):
        form = UserLoginForm(data={
            'email': 'test@example.com',
            'password': 'password123'
        })
        self.assertTrue(form.is_valid())

    def test_form_invalid_data(self):
        form = UserLoginForm(data={
            'email': 'not-an-email',
            'password': 'password123'
        })
        self.assertFalse(form.is_valid())


class UserRegisterFormTests(TestCase):
    def test_form_valid_data(self):
        form = UserRegisterForm(data={
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'password': 'password123',
            're_password': 'password123'
        })
        self.assertTrue(form.is_valid())

    def test_password_validation(self):
        form = UserRegisterForm(data={
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'password': 'password123',
            're_password': 'differentpassword'
        })
        self.assertTrue(form.is_valid())  # The form is valid, but validate_passwords will fail

        # Test password validation
        try:
            form.validate_passwords()
            self.fail("Should have raised ValidationError")
        except:
            # Check that error was added to the form
            self.assertIn('password', form.errors)

    def test_form_save(self):
        form = UserRegisterForm(data={
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'password': 'password123',
            're_password': 'password123'
        })
        self.assertTrue(form.is_valid())

        user = form.save()
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertFalse(user.is_verified_email)


class UserForgotPasswordFormTests(TestCase):
    def test_form_valid_data(self):
        form = UserForgotPasswordForm(data={
            'email': 'test@example.com'
        })
        self.assertTrue(form.is_valid())


class UserProfileFormTests(TestCase):
    def setUp(self):
        username = get_random_username()
        self.user = User.objects.create_user(
            username,
            email='profile@example.com',
            password='profilepass123'
        )

    def test_form_valid_data(self):
        form = UserProfileForm(data={
            'first_name': 'Updated',
            'last_name': 'User',
            'email': 'updated@example.com'
        }, instance=self.user)
        self.assertTrue(form.is_valid())


class UserAddressFormTests(TestCase):
    def test_form_valid_data(self):
        form = UserAddressForm(data={
            'address_line_1': '123 Test St',
            'city': 'Test City',
            'state_or_province': 'Test State',
            'country': 'Test Country',
            'postal_code': '12345',
            'is_primary': True
        })
        self.assertTrue(form.is_valid())

    def test_form_invalid_data(self):
        form = UserAddressForm(data={
            # Missing required fields
            'address_line_2': 'Apt 4B',  # Optional field
        })
        self.assertFalse(form.is_valid())
        self.assertIn('address_line_1', form.errors)
        self.assertIn('city', form.errors)
        self.assertIn('country', form.errors)
        self.assertIn('postal_code', form.errors)