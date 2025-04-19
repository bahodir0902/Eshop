import uuid
import random
from functools import wraps

from django.http import HttpResponse
from django.shortcuts import redirect

def get_random_username():
    return str(uuid.uuid4().hex)

def generate_random_code():
    return random.randint(1000, 9999)

def restrict_user(*tests, login_url="accounts:login"):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapper(request, *args, **kwargs):
            if request.user.is_superuser:
                return view_func(request, *args, *kwargs)
            for test_func in tests:
                if test_func(request, *args, **kwargs):
                    return view_func(request, *args, **kwargs)
            return HttpResponse("Forbidden", status=403)
            # return redirect(login_url)
        return _wrapper
    return decorator

def is_admin(request):
    return request.user.groups.filter(name='Admins').exists()

def is_moderator(request):
    return request.user.groups.filter(name='Moderators').exists()

def is_user(request):
    return request.user.groups.filter(name='Users').exists()
