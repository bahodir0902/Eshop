from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import logout

class InactiveUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            if request.user.last_login:
                inactive_period = timezone.now() - request.user.last_login

                if inactive_period > timedelta(days=7):
                    logout(request)

        response = self.get_response(request)
        return response