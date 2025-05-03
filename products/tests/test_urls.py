from django.test import TestCase
from django.urls import reverse, resolve
from django.utils.translation import get_language
from products.views.client import ProductListView, ProductDetailView
from products.views.admin import AddProductView, EditProductView, ManageProductView, delete_product


class ProductURLsTest(TestCase):
    def _lang_prefix(self, path):
        return f'/{get_language()}{path}'

    def test_product_list_url(self):
        """Test product list URL"""
        url = reverse('products:products')
        self.assertEqual(url, self._lang_prefix('/products/'))
        self.assertEqual(resolve(url).func.view_class, ProductListView)

    def test_product_detail_url(self):
        """Test product detail URL"""
        url = reverse('products:product_detail', args=['test-product'])
        self.assertEqual(url, self._lang_prefix('/products/test-product'))
        self.assertEqual(resolve(url).func.view_class, ProductDetailView)

    def test_add_product_url(self):
        """Test add product URL"""
        url = reverse('products:add_product')
        self.assertEqual(url, self._lang_prefix('/products/add_product/'))
        self.assertEqual(resolve(url).func.view_class, AddProductView)

    def test_manage_products_url(self):
        """Test manage products URL"""
        url = reverse('products:manage_products')
        self.assertEqual(url, self._lang_prefix('/products/manage_products/'))
        self.assertEqual(resolve(url).func.view_class, ManageProductView)

    def test_edit_product_url(self):
        """Test edit product URL"""
        url = reverse('products:edit_product', args=[1])
        self.assertEqual(url, self._lang_prefix('/products/edit_product/1'))
        self.assertEqual(resolve(url).func.view_class, EditProductView)

    def test_delete_product_url(self):
        """Test delete product URL"""
        url = reverse('products:delete_product', args=[1])
        self.assertEqual(url, self._lang_prefix('/products/delete_product/1'))
        self.assertEqual(resolve(url).func, delete_product)
