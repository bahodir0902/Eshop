from django.contrib import admin
from notifications.models import Notifications

@admin.register(Notifications)
class NotificationsAdmin(admin.ModelAdmin):
    pass