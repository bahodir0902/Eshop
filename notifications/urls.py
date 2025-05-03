from django.urls import path
from notifications.views import *

app_name = "notifications"
urlpatterns = [
    path('', NotificationView.as_view(), name="list"),
    path('mark-read/<int:notification_id>/', MarkRead.as_view(), name='mark_read'),
    path('mark-all-read/', MarkAllNotificationsAsRead.as_view(), name="mark_all_notifications_as_read")
]