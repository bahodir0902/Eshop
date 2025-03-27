from django.core.exceptions import ValidationError


def get_positive_quantity(value):
    if value < 0:
        raise ValidationError('Quantity should be greater than 0')
    return value