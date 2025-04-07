from django.urls import path
from payments.views import PaymentView, PaymentSuccessView

app_name='payments'
urlpatterns = [
    path('', PaymentView.as_view(), name='payment'),
    path('succes/', PaymentSuccessView.as_view(), name='payment_success')
]