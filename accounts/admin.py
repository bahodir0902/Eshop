from django.contrib import admin
from accounts.models import User, Address

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    pass

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    pass

