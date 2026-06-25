from rest_framework import mixins, viewsets
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bookmark, Collection, ReadingHistory
from .serializers import (
    BookmarkSerializer,
    CollectionSerializer,
    ReadingHistorySerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class _OwnedViewSet(viewsets.ModelViewSet):
    """Base: scope every queryset to the authenticated owner."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookmarkViewSet(_OwnedViewSet):
    queryset = Bookmark.objects.select_related("hadith", "hadith__book").all()
    serializer_class = BookmarkSerializer


class CollectionViewSet(_OwnedViewSet):
    queryset = Collection.objects.prefetch_related("items__hadith__book").all()
    serializer_class = CollectionSerializer


class ReadingHistoryViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAuthenticated]
    queryset = ReadingHistory.objects.select_related("hadith", "hadith__book").all()
    serializer_class = ReadingHistorySerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
