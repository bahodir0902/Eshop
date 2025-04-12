# In your app directory, create a folder called "templatetags" if it doesn't exist
# Inside that folder, create a file named "order_tags.py"

from django import template

register = template.Library()


@register.simple_tag
def calculate_subtotal(order_details):
    """Calculate the subtotal of all items in an order."""
    subtotal = 0
    for detail in order_details:
        subtotal += detail.product.price * detail.quantity
    return f"{subtotal:.2f}"


@register.simple_tag
def calculate_total(order_details, shipping_cost):
    """Calculate the total cost including shipping."""
    subtotal = 0
    for detail in order_details:
        subtotal += detail.product.price * detail.quantity

    # Convert shipping_cost to float if it's a string
    if isinstance(shipping_cost, str):
        try:
            shipping_cost = float(shipping_cost)
        except ValueError:
            shipping_cost = 0

    total = subtotal + shipping_cost
    return f"{total:.2f}"