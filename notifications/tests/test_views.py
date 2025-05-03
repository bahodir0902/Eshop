# notifications/tests/test_views_client.py
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from notifications.models import Notifications
from accounts.models import User
import json
from accounts.utils import get_random_username

class NotificationViewTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create a test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create some test notifications
        self.notification1 = Notifications.objects.create(
            to_user=self.user,
            title='Test Notification 1',
            message='This is test notification 1',
            is_read=False
        )

        self.notification2 = Notifications.objects.create(
            to_user=self.user,
            title='Test Notification 2',
            message='This is test notification 2',
            is_read=False
        )

        # Login the user
        self.client.login(email='testuser@example.com', password='testpassword')

    def test_notification_view(self):
        """Test the notification list view"""
        response = self.client.get(reverse('notifications:list'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'notifications/notifications_list.html')

        self.assertEqual(len(response.context['notifications']), 2)
        self.assertEqual(response.context['unread_count'], 2)

    def test_mark_read_view(self):
        """Test marking a notification as read"""
        # Test regular GET request
        response = self.client.get(
            reverse('notifications:mark_read', kwargs={'notification_id': self.notification1.id})
        )

        self.assertEqual(response.status_code, 302)  # Should redirect
        self.assertRedirects(response, reverse('notifications:list'))

        # Refresh from database
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertIsNotNone(self.notification1.read_at)

    def test_mark_read_ajax(self):
        """Test marking a notification as read with AJAX"""
        response = self.client.get(
            reverse('notifications:mark_read', kwargs={'notification_id': self.notification1.id}),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'success')

        # Refresh from database
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertIsNotNone(self.notification1.read_at)

    def test_mark_read_nonexistent_notification(self):
        """Test marking a non-existent notification as read"""
        response = self.client.get(
            reverse('notifications:mark_read', kwargs={'notification_id': 9999}),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'error')

    def test_mark_all_read(self):
        """Test marking all notifications as read"""
        response = self.client.get(reverse('notifications:mark_all_notifications_as_read'))

        self.assertEqual(response.status_code, 302)  # Should redirect
        self.assertRedirects(response, reverse('notifications:list'))

        # Check all notifications are marked as read
        notifications = Notifications.objects.filter(to_user=self.user)
        for notification in notifications:
            self.assertTrue(notification.is_read)
            self.assertIsNotNone(notification.read_at)

    def test_mark_all_read_ajax(self):
        """Test marking all notifications as read with AJAX"""
        response = self.client.get(
            reverse('notifications:mark_all_notifications_as_read'),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['message'], '2 notifications marked as read')

        # Check all notifications are marked as read
        notifications = Notifications.objects.filter(to_user=self.user)
        for notification in notifications:
            self.assertTrue(notification.is_read)
            self.assertIsNotNone(notification.read_at)


class NotificationAuthenticationTest(TestCase):
    def setUp(self):
        # Create a client
        self.client = Client()

        # Create a test user
        self.user = User.objects.create_user(
            username=get_random_username(),
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

        # Create a test notification
        self.notification = Notifications.objects.create(
            to_user=self.user,
            title='Test Notification',
            message='This is a test notification',
            is_read=False
        )

    def test_notification_view_requires_login(self):
        """Test that notification list view requires authentication"""
        response = self.client.get(reverse('notifications:list'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login

        # Verify redirect contains login URL
        self.assertTrue(response.url.startswith('/accounts/login/'))

    # Note: The MarkRead view doesn't have LoginRequiredMixin 
    # so we can't test it the same way as NotificationView

    def test_mark_all_read_requires_login(self):
        """Test that mark all read view requires authentication"""
        response = self.client.get(reverse('notifications:mark_all_notifications_as_read'))
        self.assertEqual(response.status_code, 302)  # Should redirect to login

        # Verify redirect contains login URL
        self.assertTrue(response.url.startswith('/accounts/login/'))