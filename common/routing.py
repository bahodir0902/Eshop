from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/counts/', consumers.CountsConsumer.as_asgi()),
]