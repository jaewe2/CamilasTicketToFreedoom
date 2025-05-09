from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HelloWorldView,
    VerifyFirebaseToken,
    OfferingViewSet,
    TagViewSet,
    MessageViewSet,
    EventViewSet,
    ReminderViewSet,
    ResourceViewSet,
    UserListView,
    UserDetailView,
    UserProfileView,
)

router = DefaultRouter()
router.register(r'offerings', OfferingViewSet, basename='offerings')
router.register(r'tags',       TagViewSet,      basename='tags')
router.register(r'messages',   MessageViewSet,  basename='messages')
router.register(r'events',     EventViewSet,    basename='events')
router.register(r'reminders',  ReminderViewSet, basename='reminders')
router.register(r'resources',  ResourceViewSet, basename='resources')

urlpatterns = [
    # --- API endpoints ---
    path('', include(router.urls)),

    # DRF login/logout for browsable API
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # Misc
    path('hello/',         HelloWorldView.as_view(),       name='hello'),
    path('verify-token/',  VerifyFirebaseToken.as_view(),  name='verify-token'),

    # Users
    path('users/',                 UserListView.as_view(),    name='user-list'),
    path('users/<str:username>/',  UserDetailView.as_view(),  name='user-detail'),

    # Profile (get/update your own profile)
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/',      UserProfileView.as_view(), name='profile'),
]

# Websocket routes (if you have them)
from api.messaging_urls import websocket_urlpatterns
urlpatterns += websocket_urlpatterns
