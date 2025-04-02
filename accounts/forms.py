from django import forms
from django.core.exceptions import ValidationError
from accounts.models import User, Address
from accounts.utils import get_random_username

class UserLoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(max_length=255, widget=forms.PasswordInput())

class UserRegisterForm(forms.ModelForm):
    re_password = forms.CharField(max_length=255, widget=forms.PasswordInput())
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 're_password']
        widgets = {
            'password': forms.PasswordInput()
        }

    def validate_passwords(self, *args, **kwargs):
        re_password = self.cleaned_data.get('re_password')
        password = self.cleaned_data.get('password')
        if str(password) != str(re_password):
            self.add_error('password', 'Password don\'t match')
            return ValidationError('Passwords don\'t match.')
        return password


    def save(self, commit = ...):
        re_password = self.cleaned_data.pop('re_password')

        user = User.objects.create_user(get_random_username(), **self.cleaned_data)
        user.is_verified_email = False

        return user

class UserForgotPasswordForm(forms.Form):
    email = forms.EmailField()

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        widgets = {
            'password': forms.PasswordInput()
        }

class UserAddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = "__all__"
        exclude = ['user']