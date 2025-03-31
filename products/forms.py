from django import forms
from products.models import Product, Inventory


class AddProductModelForm(forms.ModelForm):
    stock_count = forms.IntegerField(min_value=0)

    class Meta:
        model = Product
        fields = ['name', 'price', 'description', 'image', 'slug', 'category', 'inventory', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured']


    def validate(self, *args, **kwargs):
        pass

    def save(self, commit = ...):
        stock_count = self.cleaned_data.pop('stock_count')
        inventory = self.cleaned_data.get('inventory')

        new_inventory = Inventory.objects.create(
            name=inventory.name,
            stock_count=stock_count,
            reserved_quantity=stock_count,
            warehouse_location=inventory.warehouse_location
        )
        product = Product.objects.create(**self.cleaned_data)
        product.inventory = new_inventory

        return product

class UpdateProductModelForm(forms.ModelForm):
    stock_count = forms.IntegerField(min_value=0)
    class Meta:
        model = Product
        fields = ['name', 'price', 'description', 'image', 'slug', 'category', 'inventory', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['stock_count'].initial = self.instance.inventory.stock_count

    def save(self, commit = ...):
        stock_count = self.cleaned_data.pop('stock_count')
        # self.instance.slug = self.instance.name.lower().replace(' ', '-')

        self.instance.inventory.stock_count = stock_count
        self.instance.inventory.save()

        product = super().save(commit=False)
        if commit:
            product.save()

        return product
