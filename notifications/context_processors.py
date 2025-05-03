def notification_counts(request):
    """Add unread notification count to all templates"""
    context = {
        'unread_notifications_count': 0
    }

    if request.user.is_authenticated:
        from notifications.models import Notifications
        context['unread_notifications_count'] = Notifications.objects.filter(
            to_user=request.user, is_read=False
        ).count()

    return context