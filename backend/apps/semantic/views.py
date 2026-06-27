from django.db.models import Count
from rest_framework.generics import ListAPIView

from apps.hadith.models import Hadith
from apps.hadith.serializers import HadithListSerializer

from .models import Topic
from .serializers import TopicSerializer


class TopicListView(ListAPIView):
    """All curated topics with their hadith counts (small set — unpaginated)."""

    serializer_class = TopicSerializer
    pagination_class = None

    def get_queryset(self):
        return Topic.objects.annotate(hadith_count=Count("hadiths")).order_by("name_en")


class TopicHadithsView(ListAPIView):
    """Paginated hadiths curated under a topic (by topic slug)."""

    serializer_class = HadithListSerializer

    def get_queryset(self):
        return (
            Hadith.objects.filter(topics__topic__slug=self.kwargs["slug"])
            .select_related("book")
            .distinct()
        )
