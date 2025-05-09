from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    PostingImage,
    Tag,
    Message,
    Offering,
    Event,
    Reminder,
    Resource,
    CommunityUser,
)

User = get_user_model()

# 🖼️ Posting Image Serializer
class PostingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostingImage
        fields = ["id", "image"]

# 🔖 Tag Serializer
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]

# 🎁 Offering Serializer
class OfferingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offering
        fields = ["id", "name", "description", "extra_cost"]

# 💬 Full Message Serializer
class MessageSerializer(serializers.ModelSerializer):
    sender                    = serializers.ReadOnlyField(source="sender.email")
    sender_username           = serializers.ReadOnlyField(source="sender.username")
    sender_first_name         = serializers.ReadOnlyField(source="sender.first_name")
    sender_last_name          = serializers.ReadOnlyField(source="sender.last_name")
    sender_company_name       = serializers.ReadOnlyField(source="sender.company_name")
    sender_display_as_company = serializers.ReadOnlyField(source="sender.display_as_company")
    sender_display_name       = serializers.SerializerMethodField()
    recipient                 = serializers.ReadOnlyField(source="recipient.username")
    parent_message            = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_username",
            "sender_first_name",
            "sender_last_name",
            "sender_company_name",
            "sender_display_as_company",
            "sender_display_name",
            "recipient",
            "content",
            "created_at",
            "parent_message",
            "read",
        ]
        read_only_fields = ["sender", "created_at", "read"]

    def get_sender_display_name(self, obj):
        if obj.sender.first_name and obj.sender.last_name:
            return f"{obj.sender.first_name} {obj.sender.last_name}"
        if obj.sender.company_name and obj.sender.display_as_company:
            return obj.sender.company_name
        return obj.sender.email or obj.sender.username

# ✉️ Message Create Serializer
class MessageCreateSerializer(serializers.ModelSerializer):
    recipient_username = serializers.CharField(write_only=True)
    parent_message      = serializers.PrimaryKeyRelatedField(
                              queryset=Message.objects.all(),
                              required=False, allow_null=True
                          )

    class Meta:
        model = Message
        fields = ["id", "recipient_username", "parent_message", "content"]

    def create(self, validated_data):
        # drop any stray sender key
        validated_data.pop("sender", None)
        username = validated_data.pop("recipient_username")
        try:
            recipient = CommunityUser.objects.get(username=username)
        except CommunityUser.DoesNotExist:
            raise serializers.ValidationError({
                "recipient_username": f"User '{username}' not found."
            })

        # explicitly set sender from request
        return Message.objects.create(
            sender=self.context["request"].user,
            recipient=recipient,
            **validated_data
        )

# 🔐 User Profile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "profile_picture", "about", "interests", "graduation_date",
            "company_name", "display_as_company", "phone_number",
            "is_buyer", "is_seller", "is_admin",
        ]
        read_only_fields = ["email", "username", "is_buyer", "is_seller", "is_admin"]

# 📝 Reminder Serializer
class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ["id", "title", "course", "due_date", "notes", "status"]
        read_only_fields = ["status"]

# 🗂 Resource Serializer
class ResourceSerializer(serializers.ModelSerializer):
    file     = serializers.FileField(write_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = ["id", "title", "description", "file", "file_url", "created_at"]
        read_only_fields = ["id", "file_url", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if obj.file and request else None

# 📅 Event Serializer
class EventSerializer(serializers.ModelSerializer):
    creator = serializers.ReadOnlyField(source="creator.email")

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["creator", "created_at"]

# 👤 Community User Serializer
class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CommunityUser
        fields = [
            'id', 'username', 'email', 'first_name',
            'last_name', 'company_name', 'display_as_company',
            'profile_picture', 'display_name'
        ]

    def get_display_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        if obj.company_name and obj.display_as_company:
            return obj.company_name
        return obj.email or obj.username