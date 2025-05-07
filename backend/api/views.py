# api/views.py

from datetime import date

import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q, Count, F, DateField
from django.db.models.functions import TruncMonth, Cast
from django.contrib.auth import get_user_model

import requests

from firebase_admin import auth as firebase_auth
import api.firebase_admin_setup

from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.generics import RetrieveAPIView, ListCreateAPIView, ListAPIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError


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
    Event,
    Reminder,
    Resource,
    Message,
    CommunityUser,

)
from .serializers import (
    CommunityPostingSerializer,
    CategorySerializer,
    FavoriteSerializer,
    TagSerializer,
    ListingTagSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    UserProfileSerializer,
    PaymentMethodSerializer,
    OfferingSerializer,
    OrderSerializer,
    OverviewSerializer,
    MonthCountSerializer,
    CategoryValueSerializer,
    EventSerializer,
    ReminderSerializer,
    ResourceSerializer,
    MessageSerializer,
    UserSerializer,
)

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY


class HelloWorldView(APIView):
    def get(self, request):
        return Response({"message": "Hello from Django!"})


class VerifyFirebaseToken(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get("token")
        if not id_token:
            return Response({"error": "Token missing"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded = firebase_auth.verify_id_token(id_token)
            return Response({"uid": decoded["uid"], "email": decoded.get("email")})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class PostingDetailView(RetrieveAPIView):
    queryset = CommunityPosting.objects.all()
    serializer_class = CommunityPostingSerializer
    permission_classes = [AllowAny]
    lookup_field = "id"


class CommunityPostingViewSet(viewsets.ModelViewSet):
    """
    /api/postings/             → all listings (with ?mine=)
    /api/postings/{id}/         → detail, update, delete
    /api/postings/{id}/orders/  → orders placed on this listing (seller only)
    """
    serializer_class = CommunityPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = CommunityPosting.objects.all().order_by("-created_at")
        if self.action == "list" and self.request.user.is_authenticated:
            if self.request.query_params.get("mine") in ["true", "1", "yes"]:
                qs = qs.filter(user=self.request.user)
        return qs

    @action(detail=False, methods=["get"], url_path="my-ads", permission_classes=[IsAuthenticated])
    def my_ads(self, request):
        qs = CommunityPosting.objects.filter(user=request.user).order_by("-created_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        posting = serializer.save(user=self.request.user)
        for image in self.request.FILES.getlist("images"):
            PostingImage.objects.create(posting=posting, image=image)

    def perform_update(self, serializer):
        posting = serializer.save()
        for image in self.request.FILES.getlist("images"):
            PostingImage.objects.create(posting=posting, image=image)
        deleted_ids = self.request.data.getlist("deleted_images")
        try:
            deleted_ids = [int(i) for i in deleted_ids if str(i).isdigit()]
            if deleted_ids:
                PostingImage.objects.filter(posting=posting, id__in=deleted_ids).delete()
        except Exception:
            pass

    def destroy(self, request, *args, **kwargs):
        posting = self.get_object()
        if posting.user != request.user:
            return Response(
                {"error": "You can only delete your own listings."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        url_path="orders",
        permission_classes=[IsAuthenticated],
    )
    def orders(self, request, pk=None):
        """
        Seller-only: list all orders placed on this listing.
        GET /api/postings/{id}/orders/
        """
        posting = self.get_object()
        if posting.user != request.user:
            return Response(
                {"error": "You don’t have permission to view these orders."},
                status=status.HTTP_403_FORBIDDEN
            )
        qs = Order.objects.filter(listing=posting).order_by("-created_at")
        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user, deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="soft-delete")
    def soft_delete(self, request, pk=None):
        reminder = self.get_object()
        reminder.deleted = True
        reminder.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="mark-complete")
    def mark_complete(self, request, pk=None):
        reminder = self.get_object()
        reminder.status = Reminder.Status.COMPLETED
        reminder.save()
        return Response(self.get_serializer(reminder).data, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class OfferingViewSet(viewsets.ModelViewSet):
    queryset = Offering.objects.all()
    serializer_class = OfferingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]


class ListingTagViewSet(viewsets.ModelViewSet):
    queryset = ListingTag.objects.all()
    serializer_class = ListingTagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(recipient=user)) \
                              .order_by("created_at")

    def get_serializer_class(self):
        return MessageCreateSerializer if self.action == "create" else MessageSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["get"], url_path="inbox")
    def inbox(self, request):
        msgs = self.get_queryset()
        return Response(self.get_serializer(msgs, many=True).data)

    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        ids = request.data.get("ids", [])
        marked = Message.objects.filter(recipient=request.user, id__in=ids).update(read=True)
        return Response({"marked": marked})

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        original = self.get_object()
        content = request.data.get("content", "").strip()
        if not content:
            return Response({"error": "Content required."},
                            status=status.HTTP_400_BAD_REQUEST)
        target = original.sender if original.sender != request.user else original.recipient
        reply = Message.objects.create(
            listing=original.listing,
            sender=request.user,
            recipient=target,
            content=content,
            parent_message=original
        )
        return Response(MessageSerializer(reply).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="toggle-read")
    def toggle_read(self, request, pk=None):
        msg = self.get_object()
        if msg.recipient != request.user:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        msg.read = not msg.read
        msg.save(update_fields=["read"])
        return Response({"id": msg.id, "read": msg.read})

    @action(detail=False, methods=["delete"], url_path=r"conversation/(?P<listing_id>\d+)")
    def delete_conversation(self, request, listing_id=None):
        user = request.user
        qs = Message.objects.filter(listing_id=listing_id) \
                            .filter(Q(sender=user) | Q(recipient=user))
        count, _ = qs.delete()
        code = status.HTTP_204_NO_CONTENT if count else status.HTTP_404_NOT_FOUND
        return Response({"deleted": count}, status=code)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    """
    /api/orders/       → orders where you’re the buyer
    /api/orders/sales/ → orders placed on *your* listings
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
                 .filter(buyer=self.request.user)
                 .order_by("-created_at")
        )

    def perform_create(self, serializer):
        order = serializer.save(buyer=self.request.user)
        if order.buyer.email:
            try:
                addr = order.address_details or {}
                message = (
                    f"Hi {addr.get('first_name', '')} {addr.get('last_name', '')},\n\n"
                    f"Thanks for your purchase on Toro Marketplace!\n\n"
                    f"📦 Listing: {order.listing.title}\n"
                    f"💳 Payment: {order.payment_method.name}\n"
                    f"💰 Total: ${order.total_price}\n"
                    f"📍 Status: {order.status}\n"
                    f"🕒 Placed: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
                    f"📬 Shipping Address:\n"
                    f"{addr.get('street', '')}\n"
                    f"{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}\n"
                    f"{addr.get('country', '')}\n"
                    f"✉️ Email: {addr.get('email', '')}\n"
                    f"📞 Phone: {addr.get('phone', '')}\n\n"
                    f"You can view your receipt or manage your order in your dashboard.\n\n"
                    f"Toro Marketplace 🐂"
                )
                send_mail(
                    subject=f"✅ Order Confirmation – Order #{order.id}",
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.buyer.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"[!] Email sending failed: {e}")

    @action(detail=False, methods=["get"], url_path="sales", permission_classes=[IsAuthenticated])
    def sales(self, request):
        qs = (
            Order.objects
                 .filter(listing__user=request.user)
                 .order_by("-created_at")
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class CreatePaymentIntent(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            amount = float(request.data.get("amount", 0))
            if amount <= 0:
                return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),
                currency="usd",
                automatic_payment_methods={"enabled": True},
            )
            return Response({"client_secret": intent.client_secret})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateStripeSession(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            listing_id = request.data.get("listing_id")
            listing = CommunityPosting.objects.get(id=listing_id)

            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": int(listing.price * 100),
                        "product_data": {
                            "name": listing.title,
                            "description": listing.description,
                        },
                    },
                    "quantity": 1,
                }],
                billing_address_collection="required",
                success_url="http://localhost:3000/order-confirmation/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url="http://localhost:3000/checkout/cancel",
            )

            return Response({"sessionId": session.id})
        except CommunityPosting.DoesNotExist:
            return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Analytics: user-scoped endpoints ────────────────────────────────────────

class UserOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        total_posts = CommunityPosting.objects.filter(user=user).count()
        posts_this_month = CommunityPosting.objects.filter(
            user=user,
            created_at__year=today.year,
            created_at__month=today.month,
        ).count()

        total_sales = Order.objects.filter(buyer=user).count()
        sales_this_month = Order.objects.filter(
            buyer=user,
            created_at__year=today.year,
            created_at__month=today.month,
        ).count()

        payload = {
            "postsThisMonth": posts_this_month,
            "totalPosts": total_posts,
            "salesThisMonth": sales_this_month,
            "totalSales": total_sales,
        }
        serializer = OverviewSerializer(payload)
        return Response(serializer.data)


class UserPostsByMonthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.query_params.get("start")
        end   = request.query_params.get("end")

        qs = CommunityPosting.objects.filter(user=request.user)
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)

        qs = (
            qs
            .annotate(month_dt=TruncMonth("created_at"))
            .annotate(month=Cast("month_dt", output_field=DateField()))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        serializer = MonthCountSerializer(qs, many=True)
        return Response(serializer.data)


class UserSalesByMonthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.query_params.get("start")
        end   = request.query_params.get("end")

        qs = Order.objects.filter(buyer=request.user)
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)

        qs = (
            qs
            .annotate(month_dt=TruncMonth("created_at"))
            .annotate(month=Cast("month_dt", output_field=DateField()))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        serializer = MonthCountSerializer(qs, many=True)
        return Response(serializer.data)


class UserSalesByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.query_params.get("start")
        end   = request.query_params.get("end")

        qs = Order.objects.filter(buyer=request.user)
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)

        qs = (
            qs
            .values(category=F("listing__category__name"))
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        serializer = CategoryValueSerializer(qs, many=True)
        return Response(serializer.data)


class UserNotificationsView(APIView):
    """
    Returns:
      - unreadMessages: number of unread messages addressed to the user
      - newOrdersToday: number of new orders placed today on listings the user owns
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        unread_messages = Message.objects.filter(
            recipient=user,
            read=False
        ).count()

        new_orders_today = Order.objects.filter(
            listing__user=user,
            created_at__date=date.today()
        ).count()

        return Response({
            "unreadMessages": unread_messages,
            "newOrdersToday": new_orders_today,
        })


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class GeminiSummarizerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")

        if not text:
            return Response({"error": "Missing text."}, status=400)

        api_key = settings.GEMINI_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"


        payload = {
            "contents": [{
                "parts": [{"text": f"Summarize this college course syllabus into key sections like instructor info, office hours, major assignments, and grading policy:\n\n{text}"}]
            }]
        }

        try:
            res = requests.post(url, json=payload)
            return Response(res.json(), status=res.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all().order_by('-created_at')
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # only return the current user’s resources
        return Resource.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # set owner on create
        serializer.save(owner=self.request.user)

    def get_serializer_context(self):
        """
        Ensure that SerializerMethodField.build_absolute_uri()
        has a request to build full file_url.
        """
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    
# MessageViewSet
class MessageListCreateView(ListCreateAPIView):
    """
    GET  /api/messages/?recipient={username}
    POST /api/messages/?recipient={username}
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        recipient = self.request.query_params.get("recipient")
        if not recipient:
            raise ValidationError({"recipient": "Query param required"})
        return Message.objects.filter(
            Q(sender=user, recipient__username=recipient) |
            Q(sender__username=recipient, recipient=user)
        ).order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class UserListView(ListAPIView):
    """
    GET /api/users/
    """
    queryset = CommunityUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserDetailView(RetrieveAPIView):
    """
    GET /api/users/{username}/
    """
    queryset = CommunityUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "username"
