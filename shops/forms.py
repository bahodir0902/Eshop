from django import forms
from django.utils.translation import gettext_lazy as _
from shops.models import Shop
from products.models import Category
from django.contrib.auth import get_user_model

User = get_user_model()


class ShopForm(forms.ModelForm):
    class Meta:
        model = Shop
        fields = ['name', 'description', 'image', 'owner']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Enter shop name')}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': _('Describe your shop')}),
            'owner': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(ShopForm, self).__init__(*args, **kwargs)
        if user and not user.is_superuser:
            self.fields.get('owner', None)
        else:
            self.fields['owner'].queryset = User.objects.filter(is_staff=True)


