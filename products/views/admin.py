from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q, Sum, Avg, Count
from django.shortcuts import render, redirect
from django.utils.decorators import method_decorator
from products.models import Product, Category
from products.forms import AddProductModelForm, UpdateProductModelForm
from accounts.utils import is_admin, is_seller, restrict_user
from django.contrib.postgres.search import TrigramSimilarity
from django.views import View


def fetch_product(q, page, per_page=8, category_id=None, status=None, sort='name_asc'):
    products = Product.objects.all()

    if category_id:
        try:
            db_category = Category.objects.get(pk=category_id)
            subcategories = db_category.get_all_subcategories()
            subcategories_id = [cat.id for cat in subcategories] + [db_category.id]
            products = products.filter(category_id__in=subcategories_id)
        except Category.DoesNotExist:
            pass

    if status == 'out_of_stock':
        products = products.filter(is_available=False)
    elif status == 'active':
        products = products.filter(is_available=True)

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
        stock_count=Sum('inventory__stock_count'),
        rating=Avg('feedbacks__rating'),
        total_ordered=Count('ordered_product')
    )

    paginator = Paginator(products, per_page)
    try:
        products = paginator.get_page(page)
    except (PageNotAnInteger, EmptyPage):
        products = paginator.get_page(1)

    return products


class AddProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request):
        form = AddProductModelForm()
        return render(request, 'add_product_form.html', {'form': form})

    @method_decorator(restrict_user(is_admin, is_seller))
    def post(self, request):
        form = AddProductModelForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)

            product.save()
            return redirect('products:products')
        form.add_error(None, 'Please enter valid data.')
        print(form.errors)
        return render(request, 'add_product_form.html', {'form': form})


class EditProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = UpdateProductModelForm(instance=product)
        return render(request, 'edit_product.html', {'form': form})

    @method_decorator(restrict_user(is_admin, is_seller))
    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        form = UpdateProductModelForm(request.POST, instance=product, files=request.FILES)
        if form.is_valid():
            products = form.save(commit=False)
            products.save()
            return redirect('products:manage_products')
        form.add_error(None, 'Please enter valid data.')
        return render(request, 'edit_product.html', {'form': form})


def dashboard_statistics():
    products = Product.objects.all()
    total_products = Product.objects.all().count()
    total_active = Product.available_products.all().count()
    categories = Category.objects.filter(parent_category=None)

    value = 0
    total_out_of_stock = 0
    for product in products:
        if product.inventory.stock_count == 0:
            total_out_of_stock += 1
        value += product.price * product.inventory.stock_count

    data = {
        'total_products': total_products,
        'total_active': total_active,
        'total_inventory_value': value,
        'out_of_stock': total_out_of_stock,
        'categories': categories
    }
    return data


class ManageProductView(View):
    @method_decorator(restrict_user(is_admin, is_seller))
    def get(self, request):
        # Get all query parameters
        q = request.GET.get('q', '')
        page_number = request.GET.get('page')
        category = request.GET.get('category')
        status = request.GET.get('status')
        sort = request.GET.get('sort', 'name_asc')  # Default sort order

        # Handle per_page parameter more safely
        try:
            per_page = int(request.GET.get('per_page', 6))
        except (TypeError, ValueError):
            per_page = 6

        # Ensure per_page is within reasonable bounds
        per_page = min(max(per_page, 6), 100)

        # Fetch products with all parameters
        products = fetch_product(q, page_number, per_page, category, status, sort)

        # Get dashboard statistics
        data = dashboard_statistics()
        data['products'] = products

        # Add query parameters to context for form persistence
        data['q'] = q  # Ensure search query is in context

        # Include categories for the filter dropdown
        data['categories'] = Category.objects.all()

        return render(request, 'manage_products.html', context=data)


@restrict_user(is_admin, is_seller)
def delete_product(request, pk):
    Product.objects.filter(pk=pk).delete()
    return redirect('products:manage_products')
