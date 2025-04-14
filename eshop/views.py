# import json
# from django.core.paginator import Paginator
# from django.db.models import Q, Sum, ExpressionWrapper, F, FloatField, Avg, Count
# from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
# from products.models import Product, Inventory, Category
# from products.forms import AddProductModelForm, UpdateProductModelForm
# from accounts.utils import is_admin, is_seller, restrict_user
# from django.contrib.auth.decorators import login_required
# from carts.models import CartItems, Cart
# from django.views import View
# from django.contrib.auth.mixins import LoginRequiredMixin
# from eshop.models import Favourite, FavouriteItem
# from reviews.models import FeedBack
#
def home(request):
    return render(request, 'home.html')

#
# def fetch_product(q, page, per_page=8, category_id=None, status=None, sort='name'):
#     products = Product.objects.all().order_by('-is_available', 'name', 'created_at')
#
#     if category_id:
#         db_category = Category.objects.filter(pk=category_id).first()
#         subcategories = db_category.get_all_subcategories()
#         subcategories_id = [cat.id for cat in subcategories] + [db_category.id]
#         products = Product.objects.filter(category_id__in=subcategories_id)
#
#     if status == 'out_of_stock':
#         products = products.filter(is_available=False)
#     if status == 'active':
#         products = products.filter(is_available=True)
#
#     if q and q != 'None':
#         products = products.filter(
#             Q(name__icontains=q) |
#             Q(short_description__icontains=q) |
#             Q(full_description__icontains=q)
#         )
#
#     if sort == 'price_high':
#         products = products.order_by('-price')
#     elif sort == 'price_low':
#         products = products.order_by('price')
#     elif sort == 'name_asc':
#         products = products.order_by('name')
#     elif sort == 'name_desc':
#         products = products.order_by('-name')
#     elif sort == 'newest':
#         products = products.order_by('-created_at')
#     elif sort == 'oldest':
#         products = products.order_by('created_at')
#
#     products = products.annotate(stock_count=Sum('inventory__stock_count'))
#     products = products.annotate(rating=Avg('feedbacks__rating'))
#     products = products.annotate(total_ordered=Count('ordered_product'))
#
#     paginator = Paginator(products, per_page)
#     products = paginator.get_page(page)
#
#
#     return products
#
#
# def list_product(request):
#     q = request.GET.get('q')
#     page_number = request.GET.get('page')
#     products = fetch_product(q, page_number)
#
#     data = {
#         'products': products
#     }
#
#     cart = None
#     favourite = None
#     if request.user.is_authenticated:
#         cart = Cart.objects.filter(user=request.user).first()
#         favourite = Favourite.objects.filter(user=request.user).first()
#
#     if cart:
#         cart_items = CartItems.objects.filter(cart=cart)
#         data['cart_items'] = cart_items
#
#     if favourite:
#         favourite_items = FavouriteItem.objects.filter(favourite=favourite)
#         data['favourite_items'] = favourite_items
#
#     categories = Category.objects.all().annotate(product_count=Count('product_category'))
#     # categories = Category.objects.filter(parent_category=None).annotate(product_count=Count('product_category'))
#     # for category in categories:
#     #     pass
#
#     data['categories'] = categories
#
#     return render(request, 'list_products.html', context=data)
#
# @restrict_user(is_admin, is_seller)
# def add_product(request):
#     form = AddProductModelForm()
#     if request.method == 'POST':
#         form = AddProductModelForm(request.POST, request.FILES)
#         if form.is_valid():
#             product = form.save(commit=False)
#
#             product.save()
#             return redirect('products:products')
#         form.add_error(None, 'Please enter valid data.')
#         print(form.errors)
#         return render(request, 'add_product_form.html', {'form': form})
#
#     return render(request, 'add_product_form.html', {'form': form})
#
# @restrict_user(is_admin, is_seller)
# def edit_product(request, pk):
#     product = Product.objects.filter(pk=pk).first()
#     if request.method == 'POST':
#         form = UpdateProductModelForm(request.POST, instance=product, files=request.FILES)
#         if form.is_valid():
#             products = form.save(commit=False)
#             products.save()
#             return redirect('products:manage_products')
#         form.add_error(None, 'Please enter valid data.')
#         return render(request, 'edit_product.html', {'form': form})
#
#     form = UpdateProductModelForm(instance=product)
#     return render(request, 'edit_product.html', {'form': form})
#
# def dashboard_statistics():
#     products = Product.objects.all()
#     total_products = Product.objects.all().count()
#     total_active = Product.available_products.all().count()
#     categories = Category.objects.filter(parent_category=None)
#
#     value = 0
#     total_out_of_stock = 0
#     for product in products:
#         if product.inventory.stock_count == 0:
#             total_out_of_stock += 1
#         value += product.price * product.inventory.stock_count
#
#     data = {
#         'total_products': total_products,
#         'total_active': total_active,
#         'total_inventory_value': value,
#         'out_of_stock': total_out_of_stock,
#         'categories': categories
#     }
#     return data
#
#
# @restrict_user(is_admin, is_seller)
# def manage_products(request):
#     q = request.GET.get('q')
#     page_number = request.GET.get('page')
#     category = request.GET.get('category')
#     status = request.GET.get('status')
#     sort = request.GET.get('sort')
#     try:
#         per_page = int(request.GET.get('per_page'))
#     except Exception as e:
#         per_page = 6
#
#     products = fetch_product(q, page_number, per_page, category, status, sort)
#     data = dashboard_statistics()
#     data['products'] = products
#
#     return render(request, 'manage_products.html', context=data)
#
# @restrict_user(is_admin, is_seller)
# def delete_product(request, pk):
#     Product.objects.filter(pk=pk).delete()
#     return redirect('products:manage_products')
#
#