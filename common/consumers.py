# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class CountsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user and not isinstance(self.user, AnonymousUser):
            # Join a group specific to the user
            self.group_name = f'user_counts_{self.user.id}'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

            # Send initial counts
            await self.send_counts()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        data = json.loads(text_data)

        if data.get('type') == 'get_counts':
            await self.send_counts()

    async def send_counts(self):
        """Send current counts to the client"""
        counts = await self.get_user_counts()
        await self.send(text_data=json.dumps({
            'type': 'counts_update',
            'data': counts
        }))

    async def counts_update(self, event):
        """Handle counts update from group broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'counts_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_user_counts(self):
        from carts.models import CartItems, Cart
        from favourites.models import Favourite, FavouriteItem
        from notifications.models import Notifications

        if not self.user.is_authenticated:
            return {'cart_count': 0, 'wishlist_count': 0, 'notifications_count': 0}

        cart = Cart.objects.filter(user=self.user).first()
        cart_count = CartItems.objects.filter(cart=cart).count() if cart else 0

        favourite = Favourite.objects.filter(user=self.user).first()
        wishlist_count = FavouriteItem.objects.filter(favourite=favourite).count() if favourite else 0

        notifications_count = Notifications.objects.filter(
            to_user=self.user,
            is_read=False
        ).count()

        return {
            'cart_count': cart_count,
            'wishlist_count': wishlist_count,
            'notifications_count': notifications_count
        }
