from django import forms
from file_sharing.models import FileUpload
from django.utils.translation import gettext_lazy as _

class FileUploadForm(forms.ModelForm):
    class Meta:
        model = FileUpload
        fields = ['file', 'name', 'description', 'is_public']

        widgets = {
            'file': forms.FileInput(attrs={'class':'form-control'}),
            'name': forms.TextInput(attrs={'class':'form-control'}),
            'description': forms.Textarea(attrs={'class':'form-control', 'rows': 3}),
            'is_public': forms.CheckboxInput(attrs={'class':'form-check-input'})
        }

        labels = {
            'file': _('file'),
            'name': _('name'),
            'description': _('description'),
            'is_public': _('make public'),
        }