from datetime import date
import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q, Count, F, DateField
from django.db.models.functions import TruncMonth, Cast
from django.contrib.auth import get_user_model

from firebase_admin import auth as firebase_auth
import api.firebase_admin_setup

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveAPIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
    Reminder,
    Resource,            # ← your Resource model
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
    NotificationSerializer,
    ReminderSerializer,
    ResourceSerializer,  # ← your ResourceSerializer
)

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY


class HelloWorldView(APIView):
    def get(self, request):
        return Response({"message": "Hello from Django!"})


class VerifyFirebaseToken(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token missing"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded = firebase_auth.verify_id_token(token)
            return Response({"uid": decoded["uid"], "email": decoded.get("email")})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class PostingDetailView(RetrieveAPIView):
    queryset = CommunityPosting.objects.all()
    serializer_class = CommunityPostingSerializer
    permission_classes = [AllowAny]
    lookup_field = "id"


class CommunityPostingViewSet(viewsets.ModelViewSet):
    serializer_class = CommunityPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = CommunityPosting.objects.all().order_by("-created_at")
        if self.action == "list" and self.request.user.is_authenticated:
            mine = self.request.query_params.get("mine")
            if mine in ("true", "1", "yes"):
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
        deleted = self.request.data.getlist("deleted_images")
        try:
            ids = [int(i) for i in deleted if str(i).isdigit()]
            if ids:
                PostingImage.objects.filter(posting=posting, id__in=ids).delete()
        except Exception:
            pass

    def destroy(self, request, *args, **kwargs):
        posting = self.get_object()
        if posting.user != request.user:
            return Response({"error": "You can only delete your own listings."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["get"], url_path="orders", permission_classes=[IsAuthenticated])
    def orders(self, request, pk=None):
        posting = self.get_object()
        if posting.user != request.user:
            return Response({"error": "You don’t have permission to view these orders."}, status=status.HTTP_403_FORBIDDEN)
        qs = Order.objects.filter(listing=posting).order_by("-created_at")
        return Response(OrderSerializer(qs, many=True).data)


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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(recipient=user)).order_by("-created_at")

    def get_serializer_class(self):
        return MessageCreateSerializer if self.action == "create" else MessageSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["get"], url_path="inbox")
    def inbox(self, request):
        msgs = self.get_queryset()
        return Response(self.get_serializer(msgs, many=True).data)

    @action(detail=False, methods=["post"], url_path="send")
    def send_message(self, request):
        sender = request.user
        rid = request.data.get("recipient_id")
        txt = request.data.get("content")
        lid = request.data.get("listing_id")
        if not (rid and txt and lid):
            return Response({"error": "recipient_id, content & listing_id required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            listing = CommunityPosting.objects.get(id=lid)
            recipient = User.objects.get(id=rid)
        except (CommunityPosting.DoesNotExist, User.DoesNotExist):
            return Response({"error": "Invalid listing or recipient."}, status=status.HTTP_400_BAD_REQUEST)
        if listing.user == sender:
            return Response({"error": "Cannot message your own listing."}, status=status.HTTP_403_FORBIDDEN)
        msg = Message.objects.create(sender=sender, recipient=recipient, content=txt, listing=listing)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        s = UserProfileSerializer(request.user, context={'request': request})
        return Response(s.data)

    def put(self, request):
        s = UserProfileSerializer(request.user, data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request):
        s = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)


class CreatePaymentIntent(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            amt = float(request.data.get("amount", 0))
            if amt <= 0:
                return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
            intent = stripe.PaymentIntent.create(
                amount=int(amt * 100),
                currency="usd",
                automatic_payment_methods={"enabled": True}
            )
            return Response({"client_secret": intent.client_secret})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateStripeSession(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            lid = request.data.get("listing_id")
            listing = CommunityPosting.objects.get(id=lid)
            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": int(listing.price * 100),
                        "product_data": {"name": listing.title, "description": listing.description},
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


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        order = serializer.save(buyer=self.request.user)
        # … your existing email-notification logic …


# ─── Analytics ────────────────────────────────────────────────────────────────

class UserOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        today = date.today()
        user = request.user
        payload = {
            "postsThisMonth": CommunityPosting.objects.filter(
                user=user, created_at__year=today.year, created_at__month=today.month
            ).count(),
            "totalPosts": CommunityPosting.objects.filter(user=user).count(),
            "salesThisMonth": Order.objects.filter(
                buyer=user, created_at__year=today.year, created_at__month=today.month
            ).count(),
            "totalSales": Order.objects.filter(buyer=user).count(),
        }
        return Response(OverviewSerializer(payload).data)


class UserPostsByMonthView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start, end = request.query_params.get("start"), request.query_params.get("end")
        qs = CommunityPosting.objects.filter(user=request.user)
        if start: qs = qs.filter(created_at__date__gte=start)
        if end:   qs = qs.filter(created_at__date__lte=end)
        qs = qs.annotate(month_dt=TruncMonth("created_at")) \
               .annotate(month=Cast("month_dt", DateField())) \
               .values("month") \
               .annotate(count=Count("id")) \
               .order_by("month")
        return Response(MonthCountSerializer(qs, many=True).data)


class UserSalesByMonthView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start, end = request.query_params.get("start"), request.query_params.get("end")
        qs = Order.objects.filter(buyer=request.user)
        if start: qs = qs.filter(created_at__date__gte=start)
        if end:   qs = qs.filter(created_at__date__lte=end)
        qs = qs.annotate(month_dt=TruncMonth("created_at")) \
               .annotate(month=Cast("month_dt", DateField())) \
               .values("month") \
               .annotate(count=Count("id")) \
               .order_by("month")
        return Response(MonthCountSerializer(qs, many=True).data)


class UserSalesByCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        start, end = request.query_params.get("start"), request.query_params.get("end")
        qs = Order.objects.filter(buyer=request.user)
        if start: qs = qs.filter(created_at__date__gte=start)
        if end:   qs = qs.filter(created_at__date__lte=end)
        qs = qs.values(category=F("listing__category__name")) \
               .annotate(value=Count("id")) \
               .order_by("-value")
        return Response(CategoryValueSerializer(qs, many=True).data)


class UserNotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        unread = Message.objects.filter(recipient=user, read=False).count()
        new_ord = Order.objects.filter(listing__user=user, created_at__date=date.today()).count()
        return Response({"unreadMessages": unread, "newOrdersToday": new_ord})


# ─── Reminder Endpoints ────────────────────────────────────────────────────────

class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user, is_deleted=False).order_by("due_date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="soft-delete")
    def soft_delete(self, request, pk=None):
        r = self.get_object()
        r.is_deleted = True
        r.save()
        return Response({"success": True})

    @action(detail=True, methods=["post"], url_path="mark-complete")
    def mark_complete(self, request, pk=None):
        r = self.get_object()
        r.status = Reminder.STATUS_COMPLETED
        r.save()
        return Response({"success": True})


# ─── Resource Sharing Endpoints ────────────────────────────────────────────────

class ResourceViewSet(viewsets.ModelViewSet):
    """
    CRUD for user-shared resources (files, notes, etc.).
    """
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resource.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
