from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HelloWorldView,
    VerifyFirebaseToken,
    CommunityPostingViewSet,
    CategoryViewSet,
    PostingDetailView,
    FavoriteViewSet,
    TagViewSet,
    ListingTagViewSet,
    MessageViewSet,
    UserListView,
    UserDetailView,
    UserProfileView,
    PaymentMethodViewSet,
    OfferingViewSet,
    OrderViewSet,
    CreatePaymentIntent,
    CreateStripeSession,
    UserOverviewView,
    UserPostsByMonthView,
    UserSalesByMonthView,
    UserSalesByCategoryView,
    UserNotificationsView,
    EventViewSet,
    GeminiSummarizerView,
    ReminderViewSet,
    ResourceViewSet,
)

router = DefaultRouter()
router.register(r'postings', CommunityPostingViewSet, basename='postings')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'favorites', FavoriteViewSet, basename='favorites')
router.register(r'tags', TagViewSet, basename='tags')
router.register(r'listing-tags', ListingTagViewSet, basename='listing-tags')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'offerings', OfferingViewSet, basename='offerings')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'events', EventViewSet, basename='events')
router.register(r'reminders', ReminderViewSet, basename='reminders')
router.register(r'resources', ResourceViewSet, basename='resources')

urlpatterns = [
    path('', include(router.urls)),

    # Posting-specific orders
    path(
        'postings/<int:pk>/orders/',
        CommunityPostingViewSet.as_view({'get': 'orders'}),
        name='posting-orders'
    ),

    # Order sales summary
    path(
        'orders/sales/',
        OrderViewSet.as_view({'get': 'sales'}),
        name='order-sales'
    ),

    # Misc
    path('hello/',        HelloWorldView.as_view(),      name='hello'),
    path('verify-token/', VerifyFirebaseToken.as_view(), name='verify-token'),
    path('postings/<int:id>/', PostingDetailView.as_view(), name='posting-detail'),

    # User endpoints
    path('users/',               UserListView.as_view(),    name='user-list'),
    path('users/<str:username>/', UserDetailView.as_view(), name='user-detail'),

    # Profile
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/',      UserProfileView.as_view()),

    # Stripe
    path('create-payment-intent/', CreatePaymentIntent.as_view(), name='create-payment-intent'),
    path('create-stripe-session/', CreateStripeSession.as_view(), name='create-stripe-session'),

    # Analytics
    path('analytics/user/overview/',           UserOverviewView.as_view(),         name='analytics-user-overview'),
    path('analytics/user/posts-by-month/',     UserPostsByMonthView.as_view(),     name='analytics-user-posts-by-month'),
    path('analytics/user/sales-by-month/',     UserSalesByMonthView.as_view(),     name='analytics-user-sales-by-month'),
    path('analytics/user/sales-by-category/',  UserSalesByCategoryView.as_view(),  name='analytics-user-sales-by-category'),
    path('analytics/user/notifications/',      UserNotificationsView.as_view(),    name='analytics-user-notifications'),

    # Gemini
    path('gemini-summarize/', GeminiSummarizerView.as_view(),    name='gemini-summarize'),
]

from api.messaging_urls import websocket_urlpatterns
urlpatterns += websocket_urlpatterns
