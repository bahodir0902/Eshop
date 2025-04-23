from django.db import models
from accounts.models import User
from common.models import BaseModel
from django.utils.translation import gettext_lazy as _

class FileUpload(BaseModel):
    file = models.FileField(_('file'), upload_to='file_uploads')
    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(_("description"), null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    is_public = models.BooleanField(_('Is Public?'), default=False)

    class Meta:
        permissions = [
            ('view_all_files', 'Can view all files in the system'),
            ("manage_all_files", 'Can manage all files in the system')
        ]

    def __str__(self):
        return f'{self.name} file for {self.user.email}'

class Subscription(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    is_premium = models.BooleanField(_('Is premium?'), default=False)
    expire_date = models.DateTimeField(_("Expire date"), null=True, blank=True)

    def __str__(self):
        return f'Subscription for {self.user.email}'
