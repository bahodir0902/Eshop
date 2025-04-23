from django.contrib import admin
from file_sharing.models import FileUpload, Subscription

@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    pass

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    pass
