# api/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils.crypto import get_random_string

# for notifications
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db.models.signals import post_save
from django.dispatch import receiver


# 🔐 Custom User Model
class CommunityUser(AbstractUser):
    is_buyer = models.BooleanField(default=True)
    is_seller = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    # Profile data
    profile_picture   = models.ImageField(upload_to="profile_pictures/", null=True, blank=True)
    about             = models.TextField(blank=True)
    interests         = models.CharField(max_length=255, blank=True)
    graduation_date   = models.DateField(null=True, blank=True)

    # Additional business fields
    company_name       = models.CharField(max_length=255, blank=True, null=True)
    display_as_company = models.BooleanField(default=False)
    phone_number       = models.CharField(max_length=20, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = f"user_{get_random_string(8)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email or self.username


# 📂 Category
class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# 💳 Payment Method
class PaymentMethod(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name


# 🍱 Offering / Add-on
class Offering(models.Model):
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    extra_cost  = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} (+${self.extra_cost})"


# 📦 Community Posting
class CommunityPosting(models.Model):
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="postings")
    title           = models.CharField(max_length=255)
    description     = models.TextField()
    category        = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price           = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    location        = models.CharField(max_length=255)
    created_at      = models.DateTimeField(auto_now_add=True)
    payment_methods = models.ManyToManyField(PaymentMethod, blank=True, related_name="postings")
    offerings       = models.ManyToManyField(Offering, blank=True, related_name="postings")

    def __str__(self):
        return self.title


# 🖼️ Posting Images
class PostingImage(models.Model):
    posting     = models.ForeignKey(CommunityPosting, on_delete=models.CASCADE, related_name="images")
    image       = models.ImageField(upload_to="posting_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.posting.title}"


# ❤️ Favorites
class Favorite(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    listing    = models.ForeignKey(CommunityPosting, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "listing")

    def __str__(self):
        return f"{self.user.email} ♥ {self.listing.title}"


# 🔖 Tags
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


# 🔗 Listing-Tag Relationship
class ListingTag(models.Model):
    listing = models.ForeignKey(CommunityPosting, on_delete=models.CASCADE, related_name="tags")
    tag     = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("listing", "tag")

    def __str__(self):
        return f"{self.listing.title} - {self.tag.name}"


# 💬 Messages
class Message(models.Model):
    listing        = models.ForeignKey(CommunityPosting, on_delete=models.CASCADE, related_name="messages")
    sender         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    recipient      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages", null=True, blank=True)
    content        = models.TextField()
    created_at     = models.DateTimeField(auto_now_add=True)
    parent_message = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")
    read           = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        rec_email = self.recipient.email if self.recipient else "N/A"
        return f"Message from {self.sender.email} to {rec_email} on {self.listing.title}"


# 🧾 Order
class Order(models.Model):
    STATUS_PENDING   = "PENDING"
    STATUS_PAID      = "PAID"
    STATUS_CANCELED  = "CANCELED"
    STATUS_CHOICES   = [(STATUS_PENDING, "Pending"), (STATUS_PAID, "Paid"), (STATUS_CANCELED, "Canceled")]

    buyer           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    listing         = models.ForeignKey(CommunityPosting, on_delete=models.CASCADE, related_name="orders")
    payment_method  = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, related_name="orders")
    offerings       = models.ManyToManyField(Offering, blank=True, related_name="orders")
    total_price     = models.DecimalField(max_digits=12, decimal_places=2)
    address_details = models.JSONField(blank=True, null=True)
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at      = models.DateTimeField(auto_now_add=True)
    paid_at         = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} by {self.buyer.username} ({self.status})"


# 📅 Assessment Reminder
class Reminder(models.Model):
    STATUS_PENDING   = "PENDING"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_MISSED    = "MISSED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_MISSED, "Missed"),
    ]

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminders")
    title       = models.CharField(max_length=255)
    course      = models.CharField(max_length=255)
    due_date    = models.DateTimeField()
    notes       = models.TextField(blank=True)
    is_deleted  = models.BooleanField(default=False)
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        flag = "DELETED" if self.is_deleted else self.status
        return f"{self.title} ({self.course}) – {flag} – due {self.due_date}"


# 🔔 Notification Model
class Notification(models.Model):
    recipient           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor               = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications_from", null=True, blank=True)
    verb                = models.CharField(max_length=255)
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    target_object_id    = models.PositiveIntegerField(null=True, blank=True)
    target              = GenericForeignKey("target_content_type", "target_object_id")
    unread              = models.BooleanField(default=True)
    timestamp           = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Notification for {self.recipient} – {self.verb}"


# 🔔 Signal handlers
@receiver(post_save, sender=Message)
def notify_on_message(sender, instance, created, **kwargs):
    if not created or not instance.recipient:
        return
    Notification.objects.create(
        recipient=instance.recipient,
        actor=instance.sender,
        verb="sent you a message",
        target=instance
    )

@receiver(post_save, sender=Order)
def notify_on_order(sender, instance, created, **kwargs):
    if not created:
        return
    seller = instance.listing.user
    Notification.objects.create(
        recipient=seller,
        actor=instance.buyer,
        verb="purchased your listing",
        target=instance
    )


# ─── Resource Sharing Model ───────────────────────────────────────────────────

class Resource(models.Model):
    """
    A user-uploaded study resource (notes, files, etc.) for sharing.
    """
    owner       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resources")
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file        = models.FileField(upload_to="resources/")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} by {self.owner}"
