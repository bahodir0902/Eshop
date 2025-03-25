from django.forms import ModelForm, Form
from products.models import Product

class ProductModelForm(ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'price', 'description', 'is_available']



