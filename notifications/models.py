from typing import override
from django.db import models
from django.contrib.auth import get_user_model
from common.models import BaseModel
from django.utils.translation import gettext_lazy as _

class Notifications(BaseModel):
    to_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, verbose_name=_("To User"))
    title = models.CharField(_("Title"), max_length=255)
    message = models.TextField(_("Message"))
    is_read = models.BooleanField(_("Is Read"), default=False)
    read_at = models.DateTimeField(_("Read At"), null=True, blank=True)

    class Meta:
        verbose_name = _("Notification")
        verbose_name_plural = _("Notifications")

    @override
    def __str__(self):
        return f'{self.title} - {self.to_user.first_name}'