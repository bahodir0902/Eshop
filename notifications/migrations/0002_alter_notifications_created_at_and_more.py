# Generated by Django 5.1.7 on 2025-03-24 01:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notifications',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='notifications',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
