# mybackend/settings.py

from pathlib import Path
from dotenv import load_dotenv
import os

# ─── Base directory ───────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

# ─── Security & Debugging ─────────────────────────────────────────────────────

SECRET_KEY = 'django-insecure-s6i31x3qv6*kppkr%7rio_ur7_*ey$0-2fy1)xv6b#42--k+ox'
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("✅ Gemini API key loaded:", GEMINI_API_KEY)

DEBUG = True
ALLOWED_HOSTS = []

# ─── Application definition ───────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',
    'channels',

    'api',
]

AUTH_USER_MODEL = 'api.CommunityUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mybackend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mybackend.wsgi.application'
ASGI_APPLICATION = 'mybackend.asgi.application'

# ─── Database ─────────────────────────────────────────────────────────────────

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─── Password validation ──────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
]

# ─── Internationalization & Time ──────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─── Static & Media files ─────────────────────────────────────────────────────

STATIC_URL = '/static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── Default primary key field type ───────────────────────────────────────────

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── CORS Settings ────────────────────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ─── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.FirebaseAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ─── Channels / WebSockets ─────────────────────────────────────────────────────

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}

# ─── Stripe Payment Keys ──────────────────────────────────────────────────────

STRIPE_PUBLIC_KEY  = "pk_test_51RF0z8QwZ6p2QUvMv8etQl1SVBO3SKHD52A2rEtrBxTkt3UUDEigL7pUEoUoSHzqLl3gYREyeUFoctxmTXIsfmEE005qYckJZJ"
STRIPE_SECRET_KEY  = "sk_test_51RF0z8QwZ6p2QUvMhNYSOZL0k5sHkVXXw0ViZmnKDcaPDzgLeqWhGMlQjpwiT41NTHXqu4pU3ROH07dVWoToR5cO00sEx5fKyk"

# ─── Email Settings ──────────────────────────────────────────────────────────

EMAIL_BACKEND      = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST         = "smtp.gmail.com"
EMAIL_PORT         = 587
EMAIL_USE_TLS      = True
EMAIL_HOST_USER    = "jaewe9@gmail.com"
EMAIL_HOST_PASSWORD= "plih phvw qykb froq"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
