from django.contrib import admin
from shops.models import Shop

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    pass