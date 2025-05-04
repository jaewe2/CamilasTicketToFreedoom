# api/authentication.py

from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from firebase_admin import auth as firebase_auth
from django.contrib.auth import get_user_model

User = get_user_model()

class FirebaseAuthentication(BaseAuthentication):
    """
    Authenticate requests using Firebase ID tokens.
    If a user does not exist, create them with a username derived from their email prefix.
    """
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        id_token = auth_header.split(" ")[1]

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(
                f"Invalid Firebase token: {e}"
            )

        email = decoded_token.get("email")
        if not email:
            raise exceptions.AuthenticationFailed("Email not found in token")

        # Derive a username from the email prefix
        username_prefix = email.split('@')[0]
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username_prefix,
                'is_active': True
            }
        )

        return (user, None)
