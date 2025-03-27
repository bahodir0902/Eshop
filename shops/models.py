from typing import override
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.contrib.auth import get_user_model
from common.models import BaseModel
import os
import time
import uuid

def validate_image_size(image):
    max_size = 4 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError('Image size can\'t exceed 4 MB.')

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return os.path.join('shop_images/', unique_filename)

class Shop(BaseModel):
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True
    )

    @override
    def __str__(self):
        return f'{self.name} - {self.description}'
