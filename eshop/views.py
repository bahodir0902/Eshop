from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Product
from .forms import ProductModelForm


# Create your views here.

def home(request):
    return render(request, 'home.html')


def fetch_product(q: str | None, page: int | None):
    products = Product.objects.all().order_by('name')
    if q and q != 'None':
        products = Product.objects.filter(Q(name__icontains=q) | Q(description__icontains=q))

    paginator = Paginator(products, 6)
    products = paginator.get_page(page)

    return products


def list_product(request):
    q = request.GET.get('q')
    page_number = request.GET.get('page')
    products = fetch_product(q, page_number)

    data = {
        'products': products
    }
    return render(request, 'list_products.html', context=data)


def add_product(request):
    form = ProductModelForm()
    if request.method == 'POST':
        form = ProductModelForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('shop:list_products')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'add_product_form.html', {'form': form})

    return render(request, 'add_product_form.html', {'form': form})


def edit_product(request, pk):
    product = Product.objects.filter(pk=pk).first()
    if request.method == 'POST':
        form = ProductModelForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
            return redirect('shop:find_and_edit_product')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'edit_product.html', {'form': form})

    form = ProductModelForm(instance=product)
    return render(request, 'edit_product.html', {'form': form})


def find_and_edit_product(request):
    q = request.GET.get('q')
    page_number = request.GET.get('page')
    print(request.path)
    products = fetch_product(q, page_number)

    data = {
        'products': products
    }
    return render(request, 'find_and_edit_product.html', {'products': products})

def find_and_delete_product(request):
    q = request.GET.get('q')
    page_number = request.GET.get('page')
    print(request.path)
    products = fetch_product(q, page_number)

    data = {
        'products': products
    }
    return render(request, 'find_and_delete_product.html', {'products': products})

def delete_product(request, pk):
    product = Product.objects.filter(pk=pk).update(is_available=False)
    return redirect('shop:find_and_delete_product')

