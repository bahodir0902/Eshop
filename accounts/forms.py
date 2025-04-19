from django import forms
from django.core.exceptions import ValidationError

from accounts.models import User
from accounts.utils import get_random_username


class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(max_length=255)

    class Meta:
        widgets = {
            'email': forms.EmailInput,
            'password': forms.PasswordInput()
        }

    def validate_user(self, user):
        pass



class RegisterForm(forms.ModelForm):
    re_password = forms.CharField(max_length=255)
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 're_password']
        widgets = {
            'email': forms.EmailInput,
            'password': forms.PasswordInput(),
            're_password': forms.PasswordInput() #juda qiziq
        }

    def clean(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError("User already exists in database")

    def validate_password(self):
        password = self.cleaned_data.get('password')
        re_password = self.cleaned_data.pop('re_password')

        if not password or not re_password:
            self.add_error('re_password', 'Password dont given')
            raise ValidationError("Passwords don\'t match")

        if str(password) != str(re_password):
            self.add_error('re_password', "Password don\'t match.")
            raise ValidationError("Passwords don\'t match")

        return password

    def save(self, commit=True):
        # re_password = self.cleaned_data.pop('re_password')

        return User.objects.create_user(**self.cleaned_data, username=get_random_username())




