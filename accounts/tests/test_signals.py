from django.test import TestCase
from accounts.models import User
from unittest.mock import patch
from accounts.utils import get_random_username


class UserSignalsTests(TestCase):
    @patch('accounts.signals.get_random_username')
    def test_set_random_username_signal(self, mock_get_random_username):
        # Set the mock to return a predetermined value
        mock_get_random_username.return_value = 'test_username_123'

        # Need an initial username for creating the user
        initial_username = get_random_username()

        # Create a user with a custom username first
        user = User.objects.create(
            username=initial_username,
            email='signal@example.com',
            password='signalpass123'
        )

        # The signal should update the username
        mock_get_random_username.assert_called_once()

        # Refresh the user and check if the username was set by the signal
        user.refresh_from_db()
        self.assertEqual(user.username, 'test_username_123')