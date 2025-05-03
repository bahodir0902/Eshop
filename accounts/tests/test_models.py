from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from accounts.models import User, Address, CodePassword, CodeEmail
from accounts.utils import get_random_username


class CustomUserManagerTests(TestCase):
    def test_create_user(self):
        username = get_random_username()
        user = User.objects.create_user(
            username,
            email='test@example.com',
            password='password123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('password123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_no_email(self):
        username = get_random_username()
        user = User.objects.create_user(username, email='', password='password123')
        self.assertEqual(user.email, '')

    def test_create_superuser(self):
        username = get_random_username()
        admin_user = User.objects.create_superuser(
            username,
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)


class UserModelTests(TestCase):
    def test_user_str(self):
        username = get_random_username()
        user = User.objects.create_user(
            username,
            email='user@example.com',
            password='userpass123'
        )
        self.assertEqual(str(user), 'user@example.com')


class AddressModelTests(TestCase):
    def setUp(self):
        username = get_random_username()
        self.user = User.objects.create_user(
            username,
            email='address@example.com',
            password='addresspass123',
            first_name='Address'
        )

    def test_address_creation(self):
        address = Address.objects.create(
            user=self.user,
            address_line_1='123 Test St',
            city='Test City',
            state_or_province='Test State',
            country='Test Country',
            postal_code='12345'
        )
        self.assertEqual(address.user, self.user)
        self.assertEqual(address.address_line_1, '123 Test St')
        self.assertTrue(address.is_primary)  # Default value


class CodePasswordModelTests(TestCase):
    def setUp(self):
        username = get_random_username()
        self.user = User.objects.create_user(
            username,
            email='code@example.com',
            password='codepass123'
        )

    def test_code_creation(self):
        code = CodePassword.objects.create(
            user=self.user,
            code='1234'
        )
        self.assertEqual(code.user, self.user)
        self.assertEqual(code.code, '1234')

        self.assertTrue(code.expire_date > timezone.now())

    def test_save_deletes_previous_codes(self):
        CodePassword.objects.create(
            user=self.user,
            code='1234'
        )

        code2 = CodePassword.objects.create(
            user=self.user,
            code='5678'
        )

        codes = CodePassword.objects.filter(user=self.user)
        self.assertEqual(codes.count(), 1)
        self.assertEqual(codes.first().code, '5678')


class CodeEmailModelTests(TestCase):
    def test_code_creation(self):
        code = CodeEmail.objects.create(
            email='test@example.com',
            code='1234'
        )
        self.assertEqual(code.email, 'test@example.com')
        self.assertEqual(code.code, '1234')

        self.assertTrue(code.expire_date > timezone.now())

    def test_save_deletes_previous_codes(self):
        CodeEmail.objects.create(
            email='test@example.com',
            code='1234'
        )

        CodeEmail.objects.create(
            email='test@example.com',
            code='5678'
        )

        codes = CodeEmail.objects.filter(email='test@example.com')
        self.assertEqual(codes.count(), 1)
        self.assertEqual(codes.first().code, '5678')