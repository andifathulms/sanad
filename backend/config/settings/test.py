"""Test settings: fast, isolated, DB-agnostic.

Uses in-memory SQLite so the suite runs without Postgres (the GIN/trigram indexes
are Postgres-only and are skipped on SQLite by the migrations). Excludes the dev
debug toolbar so it isn't a test dependency.
"""
from .base import *  # noqa: F401,F403
from .base import INSTALLED_APPS

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Local-memory cache so analytics/cache tests don't need Redis.
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}

# Celery runs tasks inline during tests.
CELERY_TASK_ALWAYS_EAGER = True

# Keep the app list free of the dev-only debug toolbar.
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
