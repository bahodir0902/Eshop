from django.urls import path
from reviews.views import *

app_name = 'feedbacks'
urlpatterns = [
    path('feedback/<int:product_id>', FeedbackView.as_view(), name='feedback')
]