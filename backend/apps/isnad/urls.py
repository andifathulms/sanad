from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    GlobalNetworkView,
    HadithSanadView,
    IsnadCompareView,
    NarratorPathView,
    NarratorSearchView,
    NarratorViewSet,
)

router = DefaultRouter()
router.register("narrators", NarratorViewSet, basename="narrator")

urlpatterns = [
    path("narrators/search/", NarratorSearchView.as_view(), name="narrator-search"),
    path("narrators/path/", NarratorPathView.as_view(), name="narrator-path"),
    path("hadiths/<int:hadith_id>/sanad/", HadithSanadView.as_view(), name="hadith-sanad"),
    path("isnad/compare/", IsnadCompareView.as_view(), name="isnad-compare"),
    path("network/global/", GlobalNetworkView.as_view(), name="network-global"),
    path("", include(router.urls)),
]
