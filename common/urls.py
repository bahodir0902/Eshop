from django.urls import path
from common.views import GetCounts

app_name = "common"

urlpatterns = [
    path('get-counts/', GetCounts.as_view(), name='get_counts')
]