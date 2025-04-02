import uuid
import random
from functools import wraps
from django.shortcuts import redirect

def restrict_user(*tests, login_url='accounts:login'):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            for test_func in tests:
                if test_func(request.user):
                    return view_func(request, *args, **kwargs)
            return redirect(login_url)
        return wrapper
    return decorator


def get_random_username():
    return f'{uuid.uuid4().hex}'

def generate_random_code():
    return random.randint(1000, 9999)

def is_admin(user):
    return user.groups.filter(name='Admins').exists()

def is_moderator(user):
    return user.groups.filter(name='Moderators').exists()

def is_seller(user):
    return user.groups.filter(name='Sellers').exists()

def is_user(user):
    return user.groups.filter(name='Users').exists()

