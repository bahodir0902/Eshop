from django import forms
from products.models import Product, Inventory


class ProductModelForm(forms.ModelForm):
    stock_count = forms.IntegerField(min_value=0)


    class Meta:
        model = Product
        fields = ['name', 'price', 'description', 'image', 'slug', 'category', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured']


    def validate(self, *args, **kwargs):
        pass

    def save(self, commit = ...):
        stock_count = self.cleaned_data.pop('stock_count')
        product = Product.objects.create(**self.cleaned_data)


        return product
