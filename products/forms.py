from django import forms
from products.models import Product, Inventory, Category
from django.utils.translation import gettext_lazy as _
from shops.models import Shop


class AddProductModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user')
        super().__init__(*args, **kwargs)

        for group in user.groups.all():
            if group.name == 'Sellers':
                shop = Shop.objects.filter(owner=user)
                self.fields['shop'].initial = shop.first()
                self.fields['shop'].queryset = shop

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
        """Convert specifications string to a dictionary."""
        specifications = self.cleaned_data.get('specifications')

        if not specifications:
            return ""

        specifications = specifications.strip()

        specs_dict = {}
        pairs = specifications.split(',')

        for pair in pairs:
            pair = pair.strip()
            if ':' in pair:
                key, value = pair.split(':', 1)
                specs_dict[key.strip()] = value.strip()
            else:
                raise forms.ValidationError(f"Invalid format: '{pair}'. Expected 'key: value' format.")

        if not specs_dict:
            raise forms.ValidationError("Specifications must contain at least one valid 'key: value' pair.")

        return specifications

    class Meta:
        model = Product
        fields = ['name', 'price', 'short_description', 'full_description',
                  'key_features', 'specifications', 'image', 'slug',
                  'category', 'inventory', 'shop', 'stock_count',
                  'is_available', 'is_discounted', 'is_featured'
                  ]

    def save(self, commit=True):
        # Use the standard ModelForm save method
        product = super().save(commit=commit)
        return product


class UpdateProductModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user')
        super().__init__(*args, **kwargs)

        # Set initial stock_count from the product itself (not inventory)
        if self.instance and self.instance.pk:
            self.fields['stock_count'].initial = self.instance.stock_count

        for group in user.groups.all():
            if group.name == 'Sellers':
                shop = Shop.objects.filter(owner=user)
                self.fields['shop'].initial = shop.first()
                self.fields['shop'].queryset = shop

    stock_count = forms.IntegerField(min_value=0)
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
            'placeholder': "Feature 1, Feature 2, Feature 3. Separated by comma"
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

    def clean_specifications(self):
        specifications = self.cleaned_data.get('specifications')

        if not specifications:
            return ""

        specifications = specifications.strip()

        specs_dict = {}
        pairs = specifications.split(',')

        for pair in pairs:
            pair = pair.strip()
            if ':' in pair:
                key, value = pair.split(':', 1)
                specs_dict[key.strip()] = value.strip()
            else:
                raise forms.ValidationError(f"Invalid format: '{pair}'. Expected 'key: value' format.")

        if not specs_dict:
            raise forms.ValidationError("Specifications must contain at least one valid 'key: value' pair.")

        return specifications

    def save(self, commit=True):
        # Use the standard ModelForm save method
        product = super().save(commit=commit)
        return product


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'parent_category']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Enter category name')}),
            'parent_category': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super(CategoryForm, self).__init__(*args, **kwargs)
        self.fields['parent_category'].required = False
        self.fields['parent_category'].empty_label = _('No parent category')