from django.urls import path

from .views import TopicHadithsView, TopicListView

urlpatterns = [
    path("topics/", TopicListView.as_view()),
    path("topics/<slug:slug>/hadiths/", TopicHadithsView.as_view()),
]
