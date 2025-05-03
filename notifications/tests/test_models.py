# notifications/tests/test_models.py
from django.test import TestCase
from django.utils import timezone
from notifications.models import Notifications
from accounts.models import User
from accounts.utils import get_random_username

class NotificationsModelTest(TestCase):
    def setUp(self):
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
            message='This is a test notification message',
            is_read=False
        )

    def test_notification_creation(self):
        """Test that notification can be created with correct attributes"""
        self.assertEqual(self.notification.to_user, self.user)
        self.assertEqual(self.notification.title, 'Test Notification')
        self.assertEqual(self.notification.message, 'This is a test notification message')
        self.assertFalse(self.notification.is_read)
        self.assertIsNone(self.notification.read_at)

    def test_notification_string_representation(self):
        """Test the string representation of the notification"""
        expected_string = f'Test Notification - {self.user.first_name}'
        self.assertEqual(str(self.notification), expected_string)

    def test_mark_as_read(self):
        """Test marking a notification as read"""
        self.assertFalse(self.notification.is_read)
        self.assertIsNone(self.notification.read_at)

        # Mark as read and save
        self.notification.is_read = True
        self.notification.read_at = timezone.now()
        self.notification.save()

        # Refresh from database
        self.notification.refresh_from_db()

        self.assertTrue(self.notification.is_read)
        self.assertIsNotNone(self.notification.read_at)

    def test_notification_ordering(self):
        """Test that notifications are ordered by created_at field"""
        # Create a second notification
        notification2 = Notifications.objects.create(
            to_user=self.user,
            title='Second Notification',
            message='This is a second notification',
            is_read=False
        )

        notifications = Notifications.objects.filter(to_user=self.user).order_by('-created_at')
        self.assertEqual(notifications[0], notification2)
        self.assertEqual(notifications[1], self.notification)