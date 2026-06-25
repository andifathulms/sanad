from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    GlobalNetworkView,
    HadithSanadView,
    IsnadCompareView,
    NarratorSearchView,
    NarratorViewSet,
)

router = DefaultRouter()
router.register("narrators", NarratorViewSet, basename="narrator")

urlpatterns = [
    path("narrators/search/", NarratorSearchView.as_view(), name="narrator-search"),
    path("hadiths/<int:hadith_id>/sanad/", HadithSanadView.as_view(), name="hadith-sanad"),
    path("isnad/compare/", IsnadCompareView.as_view(), name="isnad-compare"),
    path("network/global/", GlobalNetworkView.as_view(), name="network-global"),
    path("", include(router.urls)),
]
