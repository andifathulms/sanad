"""Base settings shared across all environments."""
from datetime import timedelta
from pathlib import Path

import environ

# backend/ directory (config/settings/base.py -> parents[2])
BASE_DIR = Path(__file__).resolve().parents[2]

env = environ.Env(
    DEBUG=(bool, False),
)
# Load .env from repo root if present (one level above backend/)
environ.Env.read_env(BASE_DIR.parent / ".env")

SECRET_KEY = env("SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# --- Applications ---------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.hadith",
    "apps.isnad",
    "apps.analytics",
    "apps.semantic",
    "apps.users",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# --- Database -------------------------------------------------------------
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://sanad:sanad_dev@localhost:5432/sanad",
    ),
}

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N -----------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

# --- Static ---------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static_collected"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    # Hadiths are longer than verses — max 20 per page (see CLAUDE.md)
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    # Shared with Quranlytics so one account works on both platforms
    "SIGNING_KEY": env("SHARED_AUTH_SECRET", default=SECRET_KEY),
}

# --- CORS -----------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[env("FRONTEND_ORIGIN", default="http://localhost:3000")],
)

# --- Cache (Redis) --------------------------------------------------------
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    },
}
# Analytics responses cached 24h — corpus is static (see CLAUDE.md)
ANALYTICS_CACHE_TTL = 60 * 60 * 24

# --- Celery ---------------------------------------------------------------
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ROUTES = {
    "apps.isnad.tasks.compute_centrality": {"queue": "graph"},
    "apps.isnad.tasks.build_narrator_graph": {"queue": "graph"},
    "apps.analytics.tasks.compute_stats": {"queue": "analytics"},
    "apps.analytics.tasks.compute_similarity": {"queue": "analytics"},
}

# --- Hadith data sources --------------------------------------------------
HADITH_SOURCES = {
    "fawazahmed0": {
        "sqlite_url": "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/",
        "books": [
            "bukhari", "muslim", "abudawud", "tirmidhi",
            "nasai", "ibnmajah", "malik", "riyadussalihin",
        ],
    },
    "gadingnst": {
        "base_url": "https://api.hadith.gading.dev",
        "books": ["abu-dawud", "bukhari", "tirmidzi", "ibnu-majah", "muslim", "nasai"],
    },
    "sunnah_com": {
        "base_url": "https://api.sunnah.com/v1",
        "api_key": env("SUNNAH_COM_API_KEY", default=""),
    },
}

# Rate limiting for ingestion
INGEST_RATE_LIMIT_PER_SECOND = 1
INGEST_RETRY_ON_429 = True
INGEST_MAX_RETRIES = 3
