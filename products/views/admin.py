from django.contrib import messages
from django.contrib.auth.decorators import permission_required, login_required
from django.core.cache import cache
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db import transaction
from django.db.models import Q, Sum, Avg, Count
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.utils.decorators import method_decorator
from products.models import Product, Category
from products.forms import AddProductModelForm, UpdateProductModelForm
from accounts.utils import is_admin, is_seller, restrict_user
from django.contrib.postgres.search import TrigramSimilarity
from django.views import View
from django.utils.translation import gettext_lazy as _
from products.forms import CategoryForm
from shops.models import Shop


def fetch_product(request):
    groups = request.user.groups.all()

    for group in groups:
        if group.name == 'Sellers':
            products = Product.objects.filter(shop__owner=request.user)
            break
    else:
        products = Product.objects.all()

    q = request.GET.get('q', '')
    page_number = request.GET.get('page')
    category_id = request.GET.get('category')
    status = request.GET.get('status')
    sort = request.GET.get('sort', 'name_asc')
    try:
        per_page = int(request.GET.get('per_page', 25))
    except (TypeError, ValueError):
        per_page = 25

    per_page = min(max(per_page, 25), 100)

    if category_id:
        try:
            db_category = Category.objects.get(pk=category_id)
            subcategories = db_category.get_all_subcategories()
            subcategories_id = [cat.id for cat in subcategories] + [db_category.id]
            products = products.filter(category_id__in=subcategories_id)
        except Category.DoesNotExist:
            pass

    if status == 'out_of_stock':
        products = products.filter(stock_count=0)
    elif status == 'active':
        products = products.filter(is_available=True, stock_count__gt=0)

    if q and q.lower() != 'none':
        products = products.annotate(
            similarity_name=TrigramSimilarity('name', q),
            similarity_short=TrigramSimilarity('short_description', q),
            similarity_full=TrigramSimilarity('full_description', q),
        ).filter(
            Q(similarity_name__gt=0.2) |
            Q(similarity_short__gt=0.2) |
            Q(similarity_full__gt=0.2) |
            Q(name__icontains=q) |
            Q(short_description__icontains=q) |
            Q(full_description__icontains=q)
        ).order_by('-similarity_name')

    if sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'name_asc':
        products = products.order_by('name')
    elif sort == 'name_desc':
        products = products.order_by('-name')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    elif sort == 'oldest':
        products = products.order_by('created_at')
    else:
        products = products.order_by('-is_available', 'name')

    products = products.annotate(
        rating=Avg('feedbacks__rating'),
        total_ordered=Count('ordered_product')
    )

    paginator = Paginator(products, per_page)
    try:
        products = paginator.get_page(page_number)
    except (PageNotAnInteger, EmptyPage):
        products = paginator.get_page(1)

    return products


class ManageProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request):
        products = fetch_product(request)

        group = None
        for group in request.user.groups.all():
            if group.name == 'Admins':
                group = group.name
            elif group.name == 'Sellers':
                group = group.name

        data = dashboard_statistics(group, request)
        data['products'] = products
        data['q'] = request.GET.get('q')
        data['categories'] = Category.objects.all()

        return render(request, 'products/manage_products.html', context=data)


class AddProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request):
        form = AddProductModelForm(user=request.user)
        return render(request, 'products/add_product_form.html', {'form': form})

    @method_decorator(restrict_user(is_admin, is_seller))
    @method_decorator(transaction.atomic)
    def post(self, request):
        form = AddProductModelForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            for group in request.user.groups.all():
                if group.name == 'Sellers':
                    shop = Shop.objects.filter(owner=request.user).first()
                    if not shop:
                        return HttpResponse("You are not owner of the shop.")
                    form.instance.shop = shop
            product = form.save()
            return redirect('products:products')

        form.add_error(None, 'Please enter valid data.')
        print(form.errors)
        return render(request, 'products/add_product_form.html', {'form': form})

class EditProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = UpdateProductModelForm(instance=product, user=request.user)
        return render(request, 'products/edit_product.html', {'form': form})

    @method_decorator(restrict_user(is_admin, is_seller))
    @method_decorator(transaction.atomic)
    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = UpdateProductModelForm(request.POST, request.FILES, instance=product, user=request.user)
        if form.is_valid():
            product = form.save(commit=False)
            product.save()
            return redirect('products:manage_products')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'products/edit_product.html', {'form': form})


def get_dashboard_statistics(products):
    total_products = products.count()
    total_active = products.filter(is_available=True, stock_count__gt=0).count()
    categories = list(Category.objects.filter(parent_category=None))

    total_inventory_value = 0
    total_out_of_stock = 0

    for product in products:
        if product.stock_count == 0:
            total_out_of_stock += 1
        total_inventory_value += product.price * product.stock_count

    context_data = {
        'total_products': total_products,
        'total_active': total_active,
        'total_inventory_value': total_inventory_value,
        'out_of_stock': total_out_of_stock,
        'categories': categories
    }

    return context_data


def dashboard_statistics(group, request):
    if group == 'Admins':
        return get_dashboard_statistics(Product.objects.select_related('inventory'))
    else:
        return get_dashboard_statistics(Product.objects.select_related('inventory').filter(shop__owner=request.user))


@restrict_user(is_admin, is_seller)
@transaction.atomic
def delete_product(request, pk):
    Product.objects.filter(pk=pk).delete()
    return redirect('products:manage_products')


class AddCategoryView(View):
    @method_decorator(login_required)
    @method_decorator(permission_required('shops.add_shop', raise_exception=True))
    def get(self, request):
        form = CategoryForm()
        return render(request, 'categories/add_category.html', {
            'form': form,
        })

    @method_decorator(transaction.atomic)
    def post(self, request):
        form = CategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _('Category created successfully!'))
            return redirect('products:manage_products')
        return render(request, 'categories/add_category.html', {
            'form': form,
        })