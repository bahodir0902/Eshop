from django import template

register = template.Library()

@register.filter
def in_cart(product_id, cart_items):
    if not cart_items:
        return False
    return any(item.product.id == product_id for item in cart_items)