import requests
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from accounts.forms import *
from accounts.service import *
from django.http import JsonResponse, HttpResponse
from accounts.models import CodeEmail, User, CodePassword
from django.utils import timezone
from django.contrib import messages
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django_ratelimit.decorators import ratelimit
from django.contrib.auth.mixins import LoginRequiredMixin
from django.conf import settings
from django.utils.decorators import method_decorator
from django.db import transaction


class Login(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def get(self, request):
        form = UserLoginForm()
        return render(request, 'accounts/login.html', {'form': form})

    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def post(self, request):
        form = UserLoginForm(request.POST)
        if form.is_valid():
            user = authenticate(request, **form.cleaned_data)
            if not user:
                form.add_error('email', 'Username or password is incorrect')
                return render(request, 'accounts/login.html', {'form': form})

            login(request, user)
            return redirect('products:products')

        return redirect('accounts:login')


class Register(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='40/m', block=True))
    def get(self, request):
        form = UserRegisterForm()
        return render(request, 'accounts/register.html', {'form': form})

    @method_decorator(ratelimit(key='user_or_ip', rate='10/m', block=True))
    @method_decorator(transaction.atomic)
    def post(self, request):
        form = UserRegisterForm(request.POST)
        if form.is_valid() and form.validate_passwords():
            email = request.POST.get('email')
            first_name = request.POST.get('first_name')
            send_email_verification(email, first_name)
            form.save()
            return JsonResponse({'success': True})

        print(form.errors)
        return JsonResponse({'success': False, 'errors': form.errors})


class Logout(View):
    def get(self, request):
        logout(request)
        return redirect('products:products')


class VerifyRegistration(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    @method_decorator(transaction.atomic)
    def post(self, request):
        verification_code = request.POST.get('verification_code')
        email = request.POST.get('email')

        if not email or not verification_code:
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields'
            }, status=400)

        code_db =  CodeEmail.objects.filter(email=email).first()

        if not code_db:
            return JsonResponse({'success': False, 'error': 'Unexpected error occurred'})

        if code_db.expire_date < timezone.now():
            return JsonResponse({'success': False, 'error': 'Code is already expired, please try again later.'})

        if str(code_db.code) != str(verification_code):
            return JsonResponse({'success': False, 'error': 'Code is incorrect, please try again.'})

        user = User.objects.filter(email=email).first()
        user.is_verified_email = True
        user.save()
        CodeEmail.objects.filter(email=email).first().delete()
        return JsonResponse({'success': True, 'redirect_url': '/accounts/login/'})


class ForgotPassword(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def get(self, request):
        form = UserForgotPasswordForm()
        return render(request, 'accounts/reset_password.html', {'form': form})

    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    @method_decorator(transaction.atomic)
    def post(self, request):
        form = UserForgotPasswordForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            user = User.objects.filter(email=email).first()
            if not user:
                form.add_error('email', 'User with this email doesn\'t exists.')
                return render(request, 'accounts/reset_password.html', {'form': form})

            send_password_verification(user)
            request.session['reset_email'] = email
            return redirect('accounts:check_email')

        return render(request, 'accounts/reset_password.html', {'form': form})


class CheckEmail(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def get(self, request):
        return render(request, 'accounts/check_email.html')

    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def post(self, request):
        code = request.POST.get('verification_code')
        email = request.session.get('reset_email')
        if not code or not email:
            messages.error(request, 'Email or Code number didn\'t received, please try again.')
            return render(request, 'accounts/check_email.html')

        code_db = CodePassword.objects.filter(user=User.objects.filter(email=email).first()).first()

        if not code_db:
            messages.error(request, "Invalid verification code. Please try again.")
            return render(request, 'accounts/check_email.html')

        if code_db.expire_date < timezone.now():
            messages.error(request, "Your code has expired. Request a new one.")
            return render(request, 'accounts/check_email.html')

        if str(code_db.code) != str(code):
            messages.error(request, "Incorrect code. Please enter the correct code.")
            return render(request, 'accounts/check_email.html')

        request.session['reset_email'] = email

        return redirect('accounts:create_new_password')


class CreateNewPassword(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    def get(self, request):
        if not request.session.get('reset_email', False):
            return HttpResponse("Email is not verified")
        return render(request, 'accounts/create_new_password.html')

    @method_decorator(ratelimit(key='user_or_ip', rate='6/m', block=True))
    @method_decorator(transaction.atomic)
    def post(self, request):
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if not password or not confirm_password:
            messages.error(request, 'Passwords didn\'t received. Please try again.')
            return render(request, 'accounts/create_new_password.html')

        if str(password) != str(confirm_password):
            messages.error(request, "Passwords didn\'t match.")
            return render(request, 'accounts/create_new_password.html')

        email = request.session.get('reset_email')
        if not email:
            messages.error(request, "Unexpected error occurred in server. No email received. Perhaps you deleted email session?")

        user = User.objects.filter(email=email).first()
        user.set_password(password)
        user.save()
        return redirect('accounts:login')


class Profile(View):
    @method_decorator(login_required)
    def get(self, request):
        profile_form = UserProfileForm(instance=request.user)
        current_address = Address.objects.filter(user=request.user).first()
        if current_address:
            address_form = UserAddressForm(instance=current_address)
        else:
            address_form = UserAddressForm()

        data = {
            'profile_form': profile_form,
            'address_form': address_form
        }
        return render(request, 'accounts/profile.html', context=data)


class ProfileEdit(LoginRequiredMixin, View):
    def get(self, request):
        profile_form = UserProfileForm(instance=request.user)
        current_address = Address.objects.filter(user=request.user).first()
        if current_address:
            address_form = UserAddressForm(instance=current_address)
        else:
            address_form = UserAddressForm()

        data = {
            'profile_form': profile_form,
            'address_form': address_form
        }
        return render(request, 'accounts/profile_edit.html', context=data)

    @method_decorator(transaction.atomic)
    def post(self, request):
        profile_form = UserProfileForm(request.POST, instance=request.user)
        current_address = Address.objects.filter(user=request.user).first()

        if current_address:
            address_form = UserAddressForm(request.POST, instance=current_address)
        else:
            address_form = UserAddressForm(request.POST)

        if profile_form.is_valid() and address_form.is_valid():
            address = address_form.save(commit=False)
            address.user = request.user
            address.save()

            new_email = profile_form.cleaned_data.get('email')
            user_db = User.objects.filter(id=request.user.pk).first()
            if str(new_email) != str(user_db.email):
                request.session['new_email'] = new_email
                send_email_to_verify_email(new_email, profile_form.cleaned_data.get('first_name'))

                user_form = profile_form.save(commit=False)
                user_form.first_name = profile_form.cleaned_data.get('first_name')
                user_form.last_name = profile_form.cleaned_data.get('last_name')
                user_form.email = user_db.email
                user_form.save()

                return redirect('accounts:VerifyEmailToChangeEmail')
            profile_form.save()

            return redirect('accounts:profile')

        data = {
            'profile_form': profile_form,
            'address_form': address_form
        }
        return render(request, 'accounts/profile_edit.html', context=data)


class VerifyEmailToChangeEmail(LoginRequiredMixin, View):
    def get(self, request):
        new_email = request.session.get('new_email')
        return render(request, 'accounts/verify_email_to_change_email_passcode.html', {'new_email': new_email})

    @method_decorator(transaction.atomic)  # Added transaction atomic
    def post(self, request):
        code = request.POST.get('code')
        new_email = request.session.get('new_email')

        code_db = CodeEmail.objects.filter(email=new_email).first()
        if not code_db:
            messages.error(request, 'Code was not found in database. Please try again later.')
            return render(request, 'accounts/verify_email_to_change_email_passcode.html', {'new_email': new_email})

        if code_db.expire_date < timezone.now():
            messages.error(request, "Your code has expired. Request a new one.")
            return render(request, 'accounts/verify_email_to_change_email_passcode.html', {'new_email': new_email})

        if str(code_db.code) != str(code):
            messages.error(request, "Incorrect code. Please enter the correct code.")
            return render(request, 'accounts/verify_email_to_change_email_passcode.html', {'new_email': new_email})

        user_db = User.objects.filter(pk=request.user.pk).first()
        user_db.email = new_email
        user_db.save()
        CodeEmail.objects.filter(email=new_email).delete()

        return redirect('accounts:profile')


class GoogleLoginView(View):
    @method_decorator(ratelimit(key='user_or_ip', rate='10/m', block=True))
    def get(self, request):
        auth_url = (
            f"{settings.GOOGLE_AUTH_URL}"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            f"&response_type=code"
            f"&scope=openid email profile"
        )

        return redirect(auth_url)


class GoogleCallBackView(View):
    @method_decorator(transaction.atomic)
    def get(self, request):
        code = request.GET.get('code')
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(settings.GOOGLE_TOKEN_URL, data=token_data)
        token_json = token_response.json()
        access_token = token_json.get("access_token")

        user_info_response = requests.get(
            settings.GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        user_info = user_info_response.json()

        print(user_info)
        google_user_id = user_info.get('sub')
        first_name = user_info.get('name', None)
        last_name = user_info.get('given_name', None)
        email = user_info.get('email')

        if User.objects.filter(email=email, google_id__isnull=True).exists():
            return HttpResponse("You already in the system. Please login in a standard way.")

        user, created = User.objects.get_or_create(
            google_id=google_user_id,
            defaults={
                'username': get_random_username(),
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )

        if created:
            user.set_unusable_password()
            user.save()

        login(request, user)

        return redirect('products:products')