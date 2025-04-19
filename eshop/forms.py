from django.forms import ModelForm, Form
from .models import Product

class ProductModelForm(ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'price', 'description', 'is_available']



