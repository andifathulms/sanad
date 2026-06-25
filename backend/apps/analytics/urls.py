from django.urls import path

from .views import (
    GradeDistributionView,
    MatnSimilarityView,
    MutabiShahidView,
    NarratorCentralityView,
    OverviewView,
    WordFrequencyView,
)

urlpatterns = [
    path("analytics/word-frequency/", WordFrequencyView.as_view()),
    path("analytics/matn-similarity/", MatnSimilarityView.as_view()),
    path("analytics/grade-distribution/", GradeDistributionView.as_view()),
    path("analytics/narrator-centrality/", NarratorCentralityView.as_view()),
    path("analytics/mutabi-shahid/", MutabiShahidView.as_view()),
    path("analytics/overview/", OverviewView.as_view()),
]
