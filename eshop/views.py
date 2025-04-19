from django.contrib.auth.decorators import permission_required, user_passes_test
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render, redirect
from django.utils.decorators import method_decorator

from .models import Product
from .forms import ProductModelForm
from django.views import View
from accounts.utils import restrict_user, is_admin, is_moderator
from django.contrib.auth.mixins import LoginRequiredMixin

def home(request):
    request.user.get_all_permissions()
    return render(request, 'home.html')


def fetch_product(q: str | None, page: int | None):
    products = Product.objects.all().order_by('name')
    if q and q != 'None':
        products = Product.objects.filter(Q(name__icontains=q) | Q(description__icontains=q))

    paginator = Paginator(products, 6)
    products = paginator.get_page(page)

    return products

class ListProductView(View):
    def get(self, request):
        q = request.GET.get('q')
        page_number = request.GET.get('page')
        products = fetch_product(q, page_number)

        data = {
            'products': products
        }
        return render(request, 'list_products.html', context=data)

# def list_product(request):
#     q = request.GET.get('q')
#     page_number = request.GET.get('page')
#     products = fetch_product(q, page_number)
#
#     data = {
#         'products': products
#     }
#     return render(request, 'list_products.html', context=data)


# @restrict_user(is_admin) # o'zi Function based viewlarda shunda custom decorator yaratsa boladi
# @permission_required('eshop.add_product') bu ham bo'ladi, lekin unchalik zo'r emas
class AddProductView(LoginRequiredMixin, View):
    # @method_decorator(restrict_user(is_admin)) # eng zo'ri bu, method decorator CBV lardagi metodlari oddiy funksiyaga qoygan decoratordek ozgartirib beradi.
    @method_decorator(permission_required('eshop.add_product')) #method_decorator juda zo'r narsa
    def get(self, request):
        form = ProductModelForm()
        return render(request, 'add_product_form.html', {'form': form})
    @method_decorator(restrict_user(is_admin))
    def post(self, request):
        form = ProductModelForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('shop:list_products')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'add_product_form.html', {'form': form})

#
# def add_product(request):
#     form = ProductModelForm()
#     if request.method == 'POST':
#         form = ProductModelForm(request.POST)
#         if form.is_valid():
#             form.save()
#             return redirect('shop:list_products')
#         form.add_error(None, 'Please enter valid data.')
#         return render(request, 'add_product_form.html', {'form': form})
#
#     return render(request, 'add_product_form.html', {'form': form})

class EditProductView(LoginRequiredMixin, View):
    @method_decorator(restrict_user(is_admin))
    def get(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = ProductModelForm(instance=product)
        return render(request, 'edit_product.html', {'form': form})

    @method_decorator(restrict_user(is_admin))
    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = ProductModelForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
            return redirect('shop:find_and_edit_product')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'edit_product.html', {'form': form})

# def edit_product(request, pk):
#     product = Product.objects.filter(pk=pk).first()
#     if request.method == 'POST':
#         form = ProductModelForm(request.POST, instance=product)
#         if form.is_valid():
#             form.save()
#             return redirect('shop:find_and_edit_product')
#         form.add_error(None, 'Please enter valid data.')
#         return render(request, 'edit_product.html', {'form': form})
#
#     form = ProductModelForm(instance=product)
#     return render(request, 'edit_product.html', {'form': form})

class FindAndEditProduct(LoginRequiredMixin, View):
    @method_decorator(restrict_user(is_admin))
    def get(self, request):
        q = request.GET.get('q')
        page_number = request.GET.get('page')
        print(request.path)
        products = fetch_product(q, page_number)

        return render(request, 'find_and_edit_product.html', {'products': products})


# def find_and_edit_product(request):
#     q = request.GET.get('q')
#     page_number = request.GET.get('page')
#     print(request.path)
#     products = fetch_product(q, page_number)
#
#     data = {
#         'products': products
#     }
#     return render(request, 'find_and_edit_product.html', {'products': products})
class FindAndDeleteProduct(LoginRequiredMixin, View):
    @method_decorator(restrict_user(is_admin))
    def get(self, request):
        q = request.GET.get('q')
        page_number = request.GET.get('page')
        products = fetch_product(q, page_number)

        return render(request, 'find_and_delete_product.html', {'products': products})


# def find_and_delete_product(request):
#     q = request.GET.get('q')
#     page_number = request.GET.get('page')
#     print(request.path)
#     products = fetch_product(q, page_number)
#
#     data = {
#         'products': products
#     }
#     return render(request, 'find_and_delete_product.html', {'products': products})

def delete_product(request, pk):
    product = Product.objects.filter(pk=pk).update(is_available=False)

    return redirect('shop:find_and_delete_product')

