from django.test import TestCase
from accounts.models import User, CodeEmail, CodePassword
from accounts.service import (
    send_email_verification, send_password_verification,
    send_email_to_verify_email
)
from unittest.mock import patch, MagicMock
from accounts.utils import get_random_username


class EmailServiceTests(TestCase):
    def setUp(self):
        username = get_random_username()
        self.user = User.objects.create_user(
            username,
            email='service@example.com',
            password='servicepass123',
            first_name='Service'
        )

    @patch('accounts.service.generate_random_code')
    @patch('accounts.service.Thread')
    @patch('accounts.service.EmailMultiAlternatives')
    def test_send_email_verification(self, mock_email, mock_thread, mock_generate_code):
        # Set up mocks
        mock_generate_code.return_value = 1234
        mock_email_instance = MagicMock()
        mock_email.return_value = mock_email_instance
        mock_thread_instance = MagicMock()
        mock_thread.return_value = mock_thread_instance

        # Call the function
        send_email_verification('test@example.com', 'Test User')

        # Verify code was created in database
        code_obj = CodeEmail.objects.get(email='test@example.com')
        self.assertEqual(code_obj.code, '1234')

        # Verify email was sent
        mock_email.assert_called_once()
        mock_email_instance.attach_alternative.assert_called_once()
        mock_thread.assert_called_once()
        mock_thread_instance.start.assert_called_once()

    @patch('accounts.service.generate_random_code')
    @patch('accounts.service.Thread')
    @patch('accounts.service.EmailMultiAlternatives')
    def test_send_password_verification(self, mock_email, mock_thread, mock_generate_code):
        # Set up mocks
        mock_generate_code.return_value = 5678
        mock_email_instance = MagicMock()
        mock_email.return_value = mock_email_instance
        mock_thread_instance = MagicMock()
        mock_thread.return_value = mock_thread_instance

        # Call the function
        send_password_verification(self.user)

        # Verify code was created in database
        code_obj = CodePassword.objects.get(user=self.user)
        self.assertEqual(code_obj.code, '5678')

        # Verify email was sent
        mock_email.assert_called_once()
        mock_email_instance.attach_alternative.assert_called_once()
        mock_thread.assert_called_once()
        mock_thread_instance.start.assert_called_once()

    @patch('accounts.service.generate_random_code')
    @patch('accounts.service.Thread')
    @patch('accounts.service.EmailMultiAlternatives')
    def test_send_email_to_verify_email(self, mock_email, mock_thread, mock_generate_code):
        # Set up mocks
        mock_generate_code.return_value = 9012
        mock_email_instance = MagicMock()
        mock_email.return_value = mock_email_instance
        mock_thread_instance = MagicMock()
        mock_thread.return_value = mock_thread_instance

        # Call the function
        send_email_to_verify_email('newemail@example.com', 'Test User')

        # Verify code was created in database
        code_obj = CodeEmail.objects.get(email='newemail@example.com')
        self.assertEqual(code_obj.code, '9012')

        # Verify email was sent
        mock_email.assert_called_once()
        mock_email_instance.attach_alternative.assert_called_once()
        mock_thread.assert_called_once()
        mock_thread_instance.start.assert_called_once()