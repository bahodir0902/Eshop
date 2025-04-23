from django.contrib import messages
from django.shortcuts import redirect
from file_sharing.models import FileUpload, Subscription
from django.urls import reverse

class FileUploadLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST' and request.path == reverse('file_sharing:file_upload'):
            if request.user.is_authenticated:
                try:
                    subscription = Subscription.objects.get(user=request.user)
                    if subscription.is_premium:
                        return self.get_response(request)
                except Subscription.DoesNotExist:
                    pass

                file_count = (FileUpload.objects.filter(user=request.user).count() + 1)
                print(f"User with '{request.user.email}' email has total of {file_count} file count")
                if file_count >= 5:
                    messages.error(request, "You have reached your file upload limit (5 files)"
                        "\nXULLAS PREMIUM SOTIB OL"
                    )
                    return redirect('file_sharing:file_list')
        return self.get_response(request)