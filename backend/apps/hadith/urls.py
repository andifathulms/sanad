from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookViewSet, ChapterViewSet, HadithViewSet, SearchView

router = DefaultRouter()
router.register("books", BookViewSet, basename="book")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("hadiths", HadithViewSet, basename="hadith")

urlpatterns = [
    path("search/", SearchView.as_view(), name="search"),
    path("", include(router.urls)),
]
