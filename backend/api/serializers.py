from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    CommunityPosting,
    Category,
    PostingImage,
    Favorite,
    Tag,
    ListingTag,
    Message,
    PaymentMethod,
    Offering,
    Order,
    Notification,
    Event,
    Reminder,
    Resource,
    Message,
    CommunityUser,
)

User = get_user_model()


# 📂 Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


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


# 🔗 ListingTag Serializer
class ListingTagSerializer(serializers.ModelSerializer):
    tag = TagSerializer(read_only=True)

    class Meta:
        model = ListingTag
        fields = ["id", "tag"]


# 💳 PaymentMethod Serializer
class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "name", "icon"]


# 🎁 Offering Serializer
class OfferingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offering
        fields = ["id", "name", "description", "extra_cost"]


# 📦 CommunityPosting Serializer
class CommunityPostingSerializer(serializers.ModelSerializer):
    user                = serializers.ReadOnlyField(source="user.email")
    user_id             = serializers.ReadOnlyField(source="user.id")
    category            = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    category_name       = serializers.CharField(source="category.name", read_only=True)
    images              = PostingImageSerializer(many=True, read_only=True)
    tags                = ListingTagSerializer(many=True, read_only=True)
    favorited_by        = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    payment_methods     = PaymentMethodSerializer(many=True, read_only=True)
    payment_methods_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=PaymentMethod.objects.all(),
        source="payment_methods"
    )

    offerings           = OfferingSerializer(many=True, read_only=True)
    offerings_ids       = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Offering.objects.all(),
        source="offerings"
    )

    class Meta:
        model = CommunityPosting
        fields = [
            "id",
            "user",
            "user_id",
            "title",
            "description",
            "category",
            "category_name",
            "price",
            "location",
            "created_at",
            "images",
            "tags",
            "favorited_by",
            "payment_methods",
            "payment_methods_ids",
            "offerings",
            "offerings_ids",
        ]


# ❤️ Favorite Serializer
class FavoriteSerializer(serializers.ModelSerializer):
    user           = serializers.ReadOnlyField(source="user.email")
    listing        = serializers.PrimaryKeyRelatedField(queryset=CommunityPosting.objects.all())
    listing_title  = serializers.CharField(source="listing.title", read_only=True)
    listing_images = PostingImageSerializer(source="listing.images", many=True, read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "user", "listing", "listing_title", "listing_images", "created_at"]


# 💬 Full Message Serializer
class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.ReadOnlyField(source="sender.email")
    sender_username = serializers.ReadOnlyField(source="sender.username")
    sender_first_name = serializers.ReadOnlyField(source="sender.first_name")
    sender_last_name = serializers.ReadOnlyField(source="sender.last_name")
    sender_company_name = serializers.ReadOnlyField(source="sender.company_name")
    sender_display_as_company = serializers.ReadOnlyField(source="sender.display_as_company")
    sender_display_name = serializers.SerializerMethodField()
    recipient_username = serializers.CharField(write_only=True)
    
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
            "recipient_username",
            "content",
            "timestamp",
            "parent_message",
            "read",
        ]
        read_only_fields = ["sender", "timestamp"]
    def get_sender_display_name(self, obj):
        if obj.sender.first_name and obj.sender.last_name:
            return f"{obj.sender.first_name} {obj.sender.last_name}"
        elif obj.sender.company_name and obj.sender.display_as_company:
            return obj.sender.company_name
        elif obj.sender.email:
            return obj.sender.email
        return obj.sender.username
        
    def create(self, validated_data):
        recipient_username = validated_data.pop('recipient_username')
        try:
            recipient = CommunityUser.objects.get(username=recipient_username)
        except CommunityUser.DoesNotExist:
            raise serializers.ValidationError({
                "recipient_username": f"User with username '{recipient_username}' does not exist."
            })
        
        return Message.objects.create(
            recipient=recipient,
            **validated_data
        )


# ✉️ Simplified Message Create Serializer
class MessageCreateSerializer(serializers.ModelSerializer):
    sender    = serializers.ReadOnlyField(source="sender.email")
    recipient = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    # listing   = serializers.PrimaryKeyRelatedField(queryset=CommunityPosting.objects.all())
    content   = serializers.CharField()

    class Meta:
        model = Message
        fields = ["id", "sender", "recipient_username", "content"]

# 🔐 User Profile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "profile_picture",
            "about",
            "interests",
            "graduation_date",
            "company_name",
            "display_as_company",
            "phone_number",
            "is_buyer",
            "is_seller",
            "is_admin",
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
    # accept any uploaded file on create/update
    file     = serializers.FileField(write_only=True)
    # expose its absolute URL when reading
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = ["id", "title", "description", "file", "file_url", "created_at"]
        read_only_fields = ["id", "file_url", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


# 🧾 Order Serializer (with listing/payment + shipping + seller)
class OrderSerializer(serializers.ModelSerializer):
    buyer                   = serializers.ReadOnlyField(source="buyer.id")
    buyer_email             = serializers.ReadOnlyField(source="buyer.email")
    listing                 = serializers.PrimaryKeyRelatedField(queryset=CommunityPosting.objects.all())
    listing_title           = serializers.CharField(source="listing.title", read_only=True)
    seller_email            = serializers.CharField(source="listing.user.email", read_only=True)
    payment_method          = serializers.PrimaryKeyRelatedField(queryset=PaymentMethod.objects.all())
    payment_method_name     = serializers.CharField(source="payment_method.name", read_only=True)
    payment_method_icon     = serializers.CharField(source="payment_method.icon", read_only=True)
    offerings               = serializers.PrimaryKeyRelatedField(many=True, queryset=Offering.objects.all(), required=False)
    total_price             = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    address_details         = serializers.JSONField(required=False)
    stripe_payment_intent_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "buyer_email",
            "listing",
            "listing_title",
            "seller_email",
            "payment_method",
            "payment_method_name",
            "payment_method_icon",
            "stripe_payment_intent_id",
            "offerings",
            "total_price",
            "status",
            "created_at",
            "paid_at",
            "address_details",
        ]
        read_only_fields = ["status", "created_at", "paid_at"]

    def validate(self, data):
        listing_price   = data["listing"].price or 0
        offerings_total = sum(o.extra_cost for o in data.get("offerings", []))
        data["total_price"] = listing_price + offerings_total
        return data

    def create(self, validated_data):
        offerings = validated_data.pop("offerings", [])
        order     = Order.objects.create(**validated_data)
        order.offerings.set(offerings)
        return order


# ─── Analytics Serializers ───────────────────────────────────────────────────

class OverviewSerializer(serializers.Serializer):
    postsThisMonth  = serializers.IntegerField()
    totalPosts      = serializers.IntegerField()
    salesThisMonth  = serializers.IntegerField()
    totalSales      = serializers.IntegerField()


class MonthCountSerializer(serializers.Serializer):
    month = serializers.SerializerMethodField()
    count = serializers.IntegerField()

    def get_month(self, obj):
        m = obj.get("month")
        return m.strftime("%Y-%m") if m else None


class CategoryValueSerializer(serializers.Serializer):
    category = serializers.CharField()
    value    = serializers.IntegerField()


# ─── Notifications Serializer ────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    actor       = serializers.ReadOnlyField(source="actor.email")
    verb        = serializers.CharField()
    target_type = serializers.SerializerMethodField()
    target_id   = serializers.IntegerField(source="target_object_id", read_only=True)
    unread      = serializers.BooleanField()
    timestamp   = serializers.DateTimeField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "verb",
            "target_type",
            "target_id",
            "unread",
            "timestamp",
        ]

    def get_target_type(self, obj):
        return obj.target_content_type.model if obj.target_content_type else None


# 📅 Event Serializer

class EventSerializer(serializers.ModelSerializer):
    creator = serializers.ReadOnlyField(source="creator.email")

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["creator", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityUser
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'company_name', 
            'display_as_company', 
            'profile_picture',
            'display_name'
        ]
    
    def get_display_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.company_name and obj.display_as_company:
            return obj.company_name
        elif obj.email:
            return obj.email
        return obj.username