from django.test import TestCase, RequestFactory
from django.urls import reverse
from django.contrib.auth.models import Group, AnonymousUser
from django.http import HttpResponse
from accounts.models import User
from accounts.utils import (
    get_random_username, generate_random_code, restrict_user,
    is_admin, is_moderator, is_seller, is_user
)


class UtilFunctionsTests(TestCase):
    def test_get_random_username(self):
        username1 = get_random_username()
        username2 = get_random_username()

        self.assertIsInstance(username1, str)
        self.assertNotEqual(username1, username2)  # Should generate different values

    def test_generate_random_code(self):
        code = generate_random_code()

        self.assertIsInstance(code, int)
        self.assertGreaterEqual(code, 1000)
        self.assertLessEqual(code, 9999)


class UserGroupTests(TestCase):
    def setUp(self):
        username = get_random_username()
        self.user = User.objects.create_user(
            username,
            email='user@example.com',
            password='userpass123'
        )

        # Create groups
        self.admin_group = Group.objects.create(name='Admins')
        self.moderator_group = Group.objects.create(name='Moderators')
        self.seller_group = Group.objects.create(name='Sellers')
        self.user_group = Group.objects.create(name='Users')

    def test_is_admin(self):
        self.assertFalse(is_admin(self.user))
        self.user.groups.add(self.admin_group)
        self.assertTrue(is_admin(self.user))

    def test_is_moderator(self):
        self.assertFalse(is_moderator(self.user))
        self.user.groups.add(self.moderator_group)
        self.assertTrue(is_moderator(self.user))

    def test_is_seller(self):
        self.assertFalse(is_seller(self.user))
        self.user.groups.add(self.seller_group)
        self.assertTrue(is_seller(self.user))

    def test_is_user(self):
        self.assertFalse(is_user(self.user))
        self.user.groups.add(self.user_group)
        self.assertTrue(is_user(self.user))


class RestrictUserDecoratorTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        # Create users
        regular_username = get_random_username()
        self.regular_user = User.objects.create_user(
            regular_username,
            email='regular@example.com',
            password='regularpass123'
        )

        admin_username = get_random_username()
        self.admin_user = User.objects.create_user(
            admin_username,
            email='admin@example.com',
            password='adminpass123'
        )

        super_username = get_random_username()
        self.superuser = User.objects.create_superuser(
            super_username,
            email='super@example.com',
            password='superpass123'
        )

        # Create group
        self.admin_group = Group.objects.create(name='Admins')
        self.admin_user.groups.add(self.admin_group)

        # Create a test view with the decorator
        @restrict_user(is_admin)
        def protected_view(request):
            return HttpResponse("Access granted")

        self.protected_view = protected_view

    def test_superuser_always_passes(self):
        request = self.factory.get('/test/')
        request.user = self.superuser

        response = self.protected_view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"Access granted")

    def test_admin_group_access(self):
        request = self.factory.get('/test/')
        request.user = self.admin_user

        response = self.protected_view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"Access granted")

    def test_regular_user_redirected(self):
        request = self.factory.get('/test/')
        request.user = self.regular_user

        response = self.protected_view(request)
        self.assertEqual(response.status_code, 302)  # Redirect response