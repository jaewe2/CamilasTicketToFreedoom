import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from .models import Message

User = get_user_model()

class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user_group = f"user_{user.id}"

        # Join the user's personal notification channel
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("message", "").strip()
        recipient_username = data.get("recipient")
        sender = self.scope.get("user")

        if not content or not recipient_username:
            return

        # Lookup recipient asynchronously
        recipient = await database_sync_to_async(User.objects.get)(username=recipient_username)
        # Save message
        message = await database_sync_to_async(Message.objects.create)(
            sender=sender,
            recipient=recipient,
            content=content
        )

        serialized = {
            "id": message.id,
            "sender": sender.username,
            "recipient": recipient.username,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "read": message.read,
        }

        # Send to sender and recipient
        await self.channel_layer.group_send(
            f"user_{recipient.id}",
            {"type": "chat.message", "payload": serialized}
        )
        await self.channel_layer.group_send(
            f"user_{sender.id}",
            {"type": "chat.message", "payload": serialized}
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
