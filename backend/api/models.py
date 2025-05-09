from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils.crypto import get_random_string

# 🔐 Custom User Model
class CommunityUser(AbstractUser):
    is_buyer           = models.BooleanField(default=True)
    is_seller          = models.BooleanField(default=True)
    is_admin           = models.BooleanField(default=False)

    # Profile data
    profile_picture    = models.ImageField(upload_to="profile_pictures/", null=True, blank=True)
    about              = models.TextField(blank=True)
    interests          = models.CharField(max_length=255, blank=True)
    graduation_date    = models.DateField(null=True, blank=True)

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

# 🎁 Offering / Add-on
class Offering(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    extra_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} (+${self.extra_cost})"

# 🖼️ Posting Images
class PostingImage(models.Model):
    posting = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # adjust relation as needed
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="posting_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} uploaded at {self.uploaded_at}"

# 🔖 Tags
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

# 💬 Messages
class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sent_messages',
        on_delete=models.CASCADE
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_messages',
        on_delete=models.CASCADE
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent_message = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies"
    )
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} → {self.recipient.username}: {self.content[:20]}"

# 📅 Event Model
class Event(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="event_images/", null=True, blank=True)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# 📝 Reminder Model
class Reminder(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'Pending'
        COMPLETED = 'COMPLETED', 'Completed'

    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title    = models.CharField(max_length=200)
    course   = models.CharField(max_length=100, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    notes    = models.TextField(blank=True)
    status   = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    deleted  = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} ({self.status})"

# Resource Sharing Model
class Resource(models.Model):
    owner       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resources"
    )
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file        = models.FileField(upload_to="resources/")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} by {self.owner.username}"
