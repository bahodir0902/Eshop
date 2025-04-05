import ast
import json

from django import forms
from products.models import Product, Inventory


class AddProductModelForm(forms.ModelForm):
    stock_count = forms.IntegerField(min_value=0)
    # Add widgets for better display of our new fields
    short_description = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Enter a short, compelling description'})
    )

    full_description = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 6,
            'placeholder': 'Describe your product in detail with marketing tone'
        })
    )

    key_features = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': '["Feature 1", "Feature 2", "Feature 3"]'
        })
    )

    specifications = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': '{"Weight": "2.5kg", "Dimensions": "10 x 15 x 5 cm"}'
        })
    )

    def clean_specifications(self):
        """Ensure specifications is valid JSON object"""
        import json
        specifications = self.cleaned_data.get('specifications')
        if not specifications:
            return {}
        try:
            specs = json.loads(specifications)
            if not isinstance(specs, dict):
                raise forms.ValidationError("Specifications must be a JSON object")
            return specs
        except json.JSONDecodeError:
            raise forms.ValidationError("Invalid JSON format for specifications")

    class Meta:
        model = Product
        fields = ['name', 'price', 'short_description', 'full_description',
                  'key_features', 'specifications', 'image', 'slug',
                  'category', 'inventory', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured'
        ]

    def validate(self, *args, **kwargs):
        pass

    def save(self, commit=...):
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
    # Add widgets for better display of our new fields
    short_description = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Enter a short, compelling description'})
    )

    full_description = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 6,
            'placeholder': 'Describe your product in detail with marketing tone'
        })
    )

    key_features = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': " 'Feature 1, Feature 2, Feature 3. Separated by comma"
        })
    )

    specifications = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': '{"Weight": "2.5kg", "Dimensions": "10 x 15 x 5 cm"}'
        })
    )
    class Meta:
        model = Product
        fields = ['name', 'price', 'short_description', 'full_description',
                  'key_features', 'specifications', 'image', 'slug',
                  'category', 'inventory', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['stock_count'].initial = self.instance.inventory.stock_count

    def clean_specifications(self):
        """Convert specifications string to a dictionary."""
        specifications = self.cleaned_data.get('specifications')

        if not specifications:
            return ""

        # Clean the input string (strip spaces, ensure no unwanted characters)
        specifications = specifications.strip()

        # Split the input into key-value pairs
        specs_dict = {}
        pairs = specifications.split(',')

        for pair in pairs:
            pair = pair.strip()
            # Check if the pair contains a valid `key: value` format
            if ':' in pair:
                key, value = pair.split(':', 1)
                specs_dict[key.strip()] = value.strip()
            else:
                raise forms.ValidationError(f"Invalid format: '{pair}'. Expected 'key: value' format.")

        if not specs_dict:
            raise forms.ValidationError("Specifications must contain at least one valid 'key: value' pair.")

        return specifications

    def save(self, commit=...):
        stock_count = self.cleaned_data.pop('stock_count')
        # self.instance.slug = self.instance.name.lower().replace(' ', '-')

        self.instance.inventory.stock_count = stock_count
        self.instance.inventory.save()

        product = super().save(commit=False)
        if commit:
            product.save()

        return product
