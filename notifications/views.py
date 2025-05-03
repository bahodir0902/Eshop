from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from django.utils import timezone
from django.http import JsonResponse
from notifications.models import Notifications


class NotificationView(LoginRequiredMixin, View):
    def get(self, request):
        notifications = Notifications.objects.filter(to_user=request.user).order_by('-created_at')
        context = {
            'notifications': notifications,
            'unread_count': notifications.filter(is_read=False).count(),
        }
        return render(request, 'notifications/notifications_list.html', context)


class MarkRead(LoginRequiredMixin, View):
    def get(self, request, notification_id):
        try:
            notification = Notifications.objects.get(id=notification_id, to_user=request.user)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Notification marked as read'
                })

        except Notifications.DoesNotExist:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Notification not found'
                }, status=404)

        return redirect('notifications:list')


class MarkAllNotificationsAsRead(LoginRequiredMixin, View):
    def get(self, request):
        notifications = Notifications.objects.filter(
            to_user=request.user,
            is_read=False
        )

        count = notifications.count()

        for notification in notifications:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': f'{count} notifications marked as read'
            })

        return redirect('notifications:list')