from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookmarkViewSet,
    CollectionViewSet,
    MeView,
    ReadingHistoryViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register("bookmarks", BookmarkViewSet, basename="bookmark")
router.register("collections", CollectionViewSet, basename="collection")
router.register("history", ReadingHistoryViewSet, basename="history")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
