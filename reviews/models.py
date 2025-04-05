from typing import override
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.contrib.auth import get_user_model
from common.models import BaseModel
from products.models import Product
from django.core.exceptions import ValidationError
import os
import time
import uuid

def check_rating(value):
    if value < 0 or value > 5:
        raise ValidationError('FeedBack rating should be between 1 and 5.')
    return value


def validate_image_size(image):
    max_size = 4 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError('Image size can\'t exceed 4 MB.')

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return os.path.join('feedback_images/', unique_filename)

class FeedBack(BaseModel):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.SmallIntegerField(validators=[check_rating])
    comment = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True
    )
    is_deleted = models.BooleanField(default=False)

    @override
    def __str__(self):
        return f'{self.user.first_name} - {self.user.first_name} - {self.rating} - {self.comment[:30]}'


