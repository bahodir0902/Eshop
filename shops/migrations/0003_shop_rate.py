# Generated by Django 5.2 on 2025-05-12 11:49

import shops.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0002_alter_shop_options_alter_shop_created_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='rate',
            field=models.PositiveSmallIntegerField(default=0, validators=[shops.models.check_rating]),
        ),
    ]
