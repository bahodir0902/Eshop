from django.test import TestCase
from django.urls import reverse, resolve
from reviews.views import FeedbackView


class FeedbackURLsTest(TestCase):
    def test_feedback_url_resolves(self):
        """Test the feedback URL"""
        url = reverse('feedbacks:feedback', args=[1])
        self.assertEqual(resolve(url).func.view_class, FeedbackView)