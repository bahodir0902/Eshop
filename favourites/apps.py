from django.apps import AppConfig


class FavouritesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'favourites'

    def ready(self):
        import favourites.signals