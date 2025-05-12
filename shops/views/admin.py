from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from shops.forms import ShopForm
from django.views import View
from django.db import transaction

class AddShopView(LoginRequiredMixin, View):
    @method_decorator(permission_required('shops.add_shop', raise_exception=True))
    def get(self, request):
        form = ShopForm(user=request.user)
        return render(request, 'shops/add_shop.html', {
            'form': form,
        })

    @method_decorator(transaction.atomic)
    @method_decorator(permission_required('shops.add_shop'))
    def post(self, request):
        form = ShopForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            shop = form.save(commit=False)
            if not form.cleaned_data.get('owner'):
                shop.owner = request.user
            shop.save()
            messages.success(request, _('Shop created successfully!'))
            return redirect('products:manage_products')


        return render(request, 'shops/add_shop.html', {
            'form': form,
        })
