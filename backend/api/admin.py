from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import (
    CommunityUser,
    Message,
    Event,
    Reminder,
    Resource,
)

User = get_user_model()


@admin.register(User)
class CommunityUserAdmin(admin.ModelAdmin):
    list_display   = ("id", "username", "email", "is_buyer", "is_seller", "is_admin")
    list_filter    = ("is_buyer", "is_seller", "is_admin")
    search_fields  = ("username", "email")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display   = ('id', 'sender', 'recipient', 'content', 'created_at')
    list_filter    = ('sender', 'recipient', 'created_at')
    search_fields  = ('sender__username', 'recipient__username', 'content')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display   = ("id", "title", "creator", "date", "time", "location", "created_at")
    list_filter    = ("date", "location")
    search_fields  = ("title", "description", "location")


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display   = ("id", "user", "title", "due_date", "status", "deleted")
    list_filter    = ("status", "deleted")
    search_fields  = ("title", "course")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display   = ("id", "title", "owner", "created_at")
    list_filter    = ("created_at",)
    search_fields  = ("title",)
