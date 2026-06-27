"""Production settings (GCP Cloud Run)."""
from .base import *  # noqa: F401,F403
from .base import MIDDLEWARE, env

DEBUG = False

# WhiteNoise for static files behind Cloud Run
MIDDLEWARE = [
    MIDDLEWARE[0],  # CorsMiddleware
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *MIDDLEWARE[2:],
]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Security
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Disable the in-app HTTPS redirect when TLS is terminated at an external
# reverse proxy (the VM compose setup) — otherwise internal service-to-service
# HTTP calls (Next → Django) get 301'd. Default stays True for Cloud Run.
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# Sentry (optional)
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.1, send_default_pii=False)
