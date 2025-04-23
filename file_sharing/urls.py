from django.urls import path
from file_sharing.views import *
app_name = 'file_sharing'


urlpatterns = [
    path('', FileListView.as_view(), name='file_list'),
    path('upload/', FileUploadView.as_view(), name='file_upload'),
    path('<int:pk>', FileDetailView.as_view(), name='file_detail'),
    path('<int:pk>/update/', FileUpdateView.as_view(), name='file_update'),
    path('<int:pk>/delete/', FileDeleteView.as_view(), name='file_delete'),
]