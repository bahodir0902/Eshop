from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from accounts.forms import UserLoginForm, UserRegisterForm, UserForgotPasswordForm
from accounts.service import send_email_verification, send_password_verification
from django.http import JsonResponse
from accounts.models import CodeEmail, User, CodePassword
from django.utils import timezone
from django.contrib import messages


class Login(View):
    def get(self, request):
        form = UserLoginForm()
        return render(request, 'login.html', {'form': form})

    def post(self, request):
        form = UserLoginForm(request.POST)
        if form.is_valid():
            user = authenticate(request, **form.cleaned_data)
            if not user:
                form.add_error('email', 'Username or password is incorrect')
                return render(request, 'login.html', {'form': form})

            login(request, user)
            return redirect('shop:list_products')

        return redirect('accounts:login')

class Register(View):
    def get(self, request):
        form = UserRegisterForm()
        return render(request, 'register.html', {'form': form})

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
        return redirect('shop:list_products')


class VerifyRegistration(View):
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
    def get(self, request):
        form = UserForgotPasswordForm()
        return render(request, 'reset_password.html', {'form': form})

    def post(self, request):
        form = UserForgotPasswordForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            user = User.objects.filter(email=email).first()
            if not user:
                form.add_error('email', 'User with this email doesn\'t exists.')
                return render(request, 'reset_password.html', {'form': form})

            send_password_verification(user)
            request.session['reset_email'] = email
            return redirect('accounts:check_email')

        return render(request, 'reset_password.html', {'form': form})


class CheckEmail(View):
    def get(self, request):
        return render(request, 'check_email.html')

    def post(self, request):
        code = request.POST.get('verification_code')
        email = request.session.get('reset_email')
        if not code or not email:
            messages.error(request, 'Email or Code number didn\'t received, please try again.')
            return render(request, 'check_email.html')

        code_db = CodePassword.objects.filter(user=User.objects.filter(email=email).first()).first()

        if not code_db:
            messages.error(request, "Invalid verification code. Please try again.")
            return render(request, 'check_email.html')

        if code_db.expire_date < timezone.now():
            messages.error(request, "Your code has expired. Request a new one.")
            return render(request, 'check_email.html')

        if str(code_db.code) != str(code):
            messages.error(request, "Incorrect code. Please enter the correct code.")
            return render(request, 'check_email.html')

        request.session['reset_email'] = email

        return redirect('accounts:create_new_password')

class CreateNewPassword(View):
    def get(self, request):
        return render(request, 'create_new_password.html')

    def post(self, request):
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if not password or not confirm_password:
            messages.error(request, 'Passwords didn\'t received. Please try again.')
            return render(request, 'create_new_password.html')

        if str(password) != str(confirm_password):
            messages.error(request, "Passwords didn\'t match.")
            return render(request, 'create_new_password.html')

        email = request.session.get('reset_email')
        if not email:
            messages.error(request, "Unexpected error occurred in server. No email received. Perhaps you deleted email session?")

        user = User.objects.filter(email=email).first()
        user.set_password(password)
        user.save()
        return redirect('accounts:login')