import json
from django.core.paginator import Paginator
from django.db.models import Q, Sum, ExpressionWrapper, F, FloatField, Avg, Count
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from products.models import Product, Inventory, Category
from products.forms import AddProductModelForm, UpdateProductModelForm
from accounts.utils import is_admin, is_seller, restrict_user
from django.contrib.auth.decorators import login_required
from carts.models import CartItems, Cart
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from eshop.models import Favourite, FavouriteItem
from reviews.models import FeedBack
