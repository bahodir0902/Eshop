from django import forms
from django.core.exceptions import ValidationError
from accounts.models import User, Profile
from accounts.utils import get_random_username
from django.utils.translation import gettext_lazy as _

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

class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=255)
    last_name = forms.CharField(max_length=255)
    email = forms.EmailField()

    class Meta:
        model = Profile
        fields = ['image', 'phone', 'bio']
        labels = {
            'first_name': _('first_name'),
            'last_name': _('last_name'),
            'email': _('email'),
            'phone': _('phone'),
            'bio': _('bio'),
            'image': _('image'),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None) # shu yerga user keladi
        print(f'{self.user=}')
        super().__init__(*args, **kwargs)
        if self.user:
            self.fields['first_name'].initial = self.user.first_name
            self.fields['last_name'].initial = self.user.last_name
            self.fields['email'].initial = self.user.email





