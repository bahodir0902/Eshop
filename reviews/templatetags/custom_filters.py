from django import template

register = template.Library()

@register.filter
def dict_get(d, key):
    try:
        key = int(key)
    except (ValueError, TypeError):
        return None
    return d.get(key) if d else None
