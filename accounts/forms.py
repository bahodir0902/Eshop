from django import forms
from django.core.exceptions import ValidationError
from accounts.models import User, Address
from accounts.utils import get_random_username
from django.utils.translation import gettext_lazy as _


class UserLoginForm(forms.Form):
    email = forms.EmailField(label=_("Email"))
    password = forms.CharField(label=_("Password"), max_length=255, widget=forms.PasswordInput())

    class Meta:
        labels = {
            'email': _("Email")
        }


class UserRegisterForm(forms.ModelForm):
    re_password = forms.CharField(
        label=_("Repeat Password"),
        max_length=255,
        widget=forms.PasswordInput()
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 're_password']
        widgets = {
            'password': forms.PasswordInput()
        }
        labels = {
            'first_name': _("First Name"),
            'last_name': _("Last Name"),
            'email': _("Email"),
            'password': _("Password"),
        }

    def validate_passwords(self, *args, **kwargs):
        re_password = self.cleaned_data.get('re_password')
        password = self.cleaned_data.get('password')
        if str(password) != str(re_password):
            self.add_error('password', _("Passwords don't match."))
            return ValidationError(_("Passwords don't match."))
        return password

    def save(self, commit=True):
        self.cleaned_data.pop('re_password')
        user = User.objects.create_user(get_random_username(), **self.cleaned_data)
        user.is_verified_email = False
        return user


class UserForgotPasswordForm(forms.Form):
    email = forms.EmailField(label=_("Email"))


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        labels = {
            'first_name': _("First Name"),
            'last_name': _("Last Name"),
            'email': _("Email"),
        }


class UserAddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = '__all__'
        exclude = ['user']
        labels = {
            'address_line_1': _("Address Line 1"),
            'address_line_2': _("Address Line 2"),
            'city': _("City"),
            'state_or_province': _("State or Province"),
            'country': _("Country"),
            'postal_code': _("Postal Code"),
            'is_primary': _("Primary Address"),
        }
