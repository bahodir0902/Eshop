from django.core.exceptions import ValidationError
from django.db.models.fields import return_None
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views import View
from accounts.forms import LoginForm, RegisterForm
from django.contrib.auth import login, authenticate, logout
from accounts.models import User, CodePassword
from django.contrib import messages
from django.conf import settings
import requests
from accounts.utils import get_random_username
from accounts.services import send_email_verification
from django.utils import timezone

class LoginView(View):
    def get(self, request):
        form = LoginForm()
        data = {
            'form': form
        }
        return render(request, 'login.html', context=data)

    def post(self, request):
        form = LoginForm(request.POST)

        if form.is_valid():
            print('valid')
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if not user:
                messages.error(request,
                               "User doesn\'t exists in database")  # boshqacha usul ham bor edi, togridan togri forms ni ichida validatsiya yozib ketish
                return render(request, 'login.html', context={'form': form})

            login(request, user)
            return redirect('shop:list_products')

        data = {
            'form': form
        }
        return render(request, 'login.html', context=data)


class RegisterView(View):
    def get(self, request):
        form = RegisterForm()
        data = {
            'form': form
        }
        return render(request, 'register.html', context=data)

    def post(self, request):
        form = RegisterForm(request.POST)
        if form.is_valid() and form.validate_password():
            form.save()

            return redirect('accounts:login')
        print('not valid', form.errors)

        data = {
            'form': form
        }
        return render(request, 'register.html', context=data)


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('shop:list_products')


class GoogleLoginView(View):
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
        user_info_response = requests.get(settings.GOOGLE_USER_INFO_URL,
                                          headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_info_response.json()

        print(user_info)
        google_user_id = user_info.get('sub')
        first_name = user_info.get('name', None)
        last_name = user_info.get('given_name', None)
        email = user_info.get('email')

        if User.objects.filter(email=email, google_id__isnull=True).exists():
            return HttpResponse("NIMA? You already in the system! Please, login in standard way", status=401)

        user, created = User.objects.get_or_create(
            google_id=google_user_id,
            defaults={
                'username': get_random_username(),
                'email': email,
                'profile_photo': user_info.get('picture'),
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        # agar user endi birincha marta kirsa, uning parolini ishlatib bolmaydigan qilib qoyamiz,
        # shunday qilib u tizimimizga faqat oauth orqali kira oladi
        if created:
            user.set_unusable_password()
            user.save()

        login(request, user)
        return redirect('shop:list_products')


class ForgotPassword(View):
    def get(self, request):
        return render(request, 'forgot-password.html')

    def post(self, request):
        email = request.POST.get('email')
        if not email:
            messages.error(request, "Email didn\'t submitted. You tried to hack us")
            return render(request, 'forgot-password.html')

        user = User.objects.filter(email=email).first()
        if not user:
            messages.error(request, "User with this email doesn\'t exists.")
            return render(request, 'forgot-password.html')

        send_email_verification(user)
        request.session['restore_email'] = user.email
        return redirect('accounts:check_email')


class CheckEmailView(View):
    def get(self, request):
        return render(request, 'check-email.html')

    def post(self, request):
        code = request.POST.get('code')
        if not code:
            messages.error(request, "Code didn\'t received. You tried to hack us?")
        email = request.session.get('restore_email')
        db_code = CodePassword.objects.filter(email=email).first()

        if db_code.expire_date < timezone.now():
            messages.error(request, "Code is already expired. Please request a new one")
            return render(request, 'check-email.html')

        if str(code) != str(db_code.code):
            messages.error(request, "Code is incorrect")
            return render(request, 'check-email.html')

        return redirect('accounts:create_new_password')


class CreateNewPasswordView(View):
    def get(self, request):
        return render(request, 'create-new-password.html')

    def post(self, request):
        email = request.session.get('restore_email')
        if not email:
            messages.error(request, "You have removed email from session. Hacker!")
            return render(request, 'create-new-password.html')


        password = request.POST.get('password')
        re_password = request.POST.get('re-password')

        if not password or not re_password:
            messages.error(request, "Passwords didn\'t received hackers!!!")
            return render(request, 'create-new-password.html')

        if str(password) != str(re_password):
            messages.error(request, "Passwords didn\'t match")
            return render(request, "create-new-password.html")

        user = User.objects.filter(email=email).first()
        if not user:
            messages.error(request, "User somehow was deleted from database.")
            return render(request, "create-new-password.html")

        user.set_password(password)
        user.save()
        request.session.pop('restore_email')
        return redirect('accounts:login')
