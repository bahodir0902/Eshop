# Generated by Django 5.2 on 2025-04-14 13:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('eshop', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='favouriteitem',
            name='favourite',
        ),
        migrations.RemoveField(
            model_name='favouriteitem',
            name='product',
        ),
        migrations.DeleteModel(
            name='Favourite',
        ),
        migrations.DeleteModel(
            name='FavouriteItem',
        ),
    ]
