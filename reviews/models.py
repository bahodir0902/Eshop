from typing import override
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.contrib.auth import get_user_model
from common.models import BaseModel
from products.models import Product
import os
import time
import uuid
from django.utils.translation import gettext_lazy as _

def check_rating(value):
    if value < 0 or value > 5:
        raise ValidationError(_('FeedBack rating should be between 1 and 5.'))
    return value


def validate_image_size(image):
    max_size = 4 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError(_('Image size can\'t exceed 4 MB.'))

def unique_image_path(instance, filename):
    ext = filename.split('.')[-1]  # Get file extension
    unique_filename = f"{int(time.time())}_{uuid.uuid4().hex}.{ext}"  # Generate unique name with timestamp
    return os.path.join('feedback_images/', unique_filename)

class FeedBack(BaseModel):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, verbose_name=_("User"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='feedbacks', verbose_name=_("Product"))
    rating = models.SmallIntegerField(_("Rating"), validators=[check_rating])
    comment = models.TextField(_("Comment"))
    is_anonymous = models.BooleanField(_("Is Anonymous"), default=False)
    image = models.ImageField(
        upload_to=unique_image_path,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']), validate_image_size],
        null=True,
        blank=True,
        verbose_name=_("Image")
    )
    is_deleted = models.BooleanField(_("Is Deleted"), default=False)

    class Meta:
        verbose_name = _("Feedback")
        verbose_name_plural = _("Feedbacks")

    @override
    def __str__(self):
        return f'{self.user.first_name} - {self.user.first_name} - {self.rating} - {self.comment[:30]}'