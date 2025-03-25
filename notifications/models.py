from typing import override

from django.db import models
from django.contrib.auth import get_user_model
from common.models import BaseModel

class Notifications(BaseModel):
    to_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    @override
    def __str__(self):
        return f'{self.title} - {self.to_user.first_name}'