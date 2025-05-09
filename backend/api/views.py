from datetime import date

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

import requests
from firebase_admin import auth as firebase_auth
import api.firebase_admin_setup

from rest_framework import viewsets, permissions, status, authentication
from rest_framework.decorators import action
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from django.db.models import Q

from .models import (
    Offering,
    PostingImage,
    Tag,
    Message,
    Event,
    Reminder,
    Resource,
    CommunityUser,
)
from .serializers import (
    OfferingSerializer,
    PostingImageSerializer,
    TagSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    EventSerializer,
    ReminderSerializer,
    ResourceSerializer,
    UserSerializer,
    UserProfileSerializer,
)

User = get_user_model()


# Custom Firebase JWT authentication for DRF
class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith('Bearer '):
            return None

        id_token = header.split('Bearer ')[1]
        try:
            decoded = firebase_auth.verify_id_token(id_token)
        except Exception as e:
            raise authentication.AuthenticationFailed(f'Invalid Firebase token: {e}')

        # you can map decoded['uid'] -> your Django user here
        user, _ = User.objects.get_or_create(username=decoded['uid'])
        return (user, None)


class HelloWorldView(APIView):
    authentication_classes = []              # public
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "Hello from Django!"})


class VerifyFirebaseToken(APIView):
    authentication_classes = []              # public
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


# 🎁 Offering Endpoints
class OfferingViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Offering.objects.all()
    serializer_class = OfferingSerializer


# 🔖 Tag Endpoints
class TagViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


# 💬 Message Endpoints
class MessageViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by("created_at")

    def get_serializer_class(self):
        return MessageCreateSerializer if self.action == "create" else MessageSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["get"], url_path="inbox")
    def inbox(self, request):
        msgs = self.get_queryset()
        return Response(self.get_serializer(msgs, many=True).data)


# 📝 Reminder Endpoints
class ReminderViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ReminderSerializer

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


# 📅 Event Endpoints
class EventViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


# 🌐 Resource Endpoints
class ResourceViewSet(viewsets.ModelViewSet):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ResourceSerializer

    def get_queryset(self):
        return Resource.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# 👤 User Profile
class UserProfileView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# 👥 User List & Detail
class UserListView(ListAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = CommunityUser.objects.all()
    serializer_class = UserSerializer


class UserDetailView(RetrieveAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = CommunityUser.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
