from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from file_sharing.forms import FileUploadForm
from file_sharing.models import FileUpload
from django.db.models import Q
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.contrib import messages


class FileListView(LoginRequiredMixin, View):
    def get(self, request):
        if request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files'):
            files = FileUpload.objects.all().order_by('-created_at')
        else:
            files = FileUpload.objects.filter(Q(user=request.user) | Q(is_public=True)).order_by('-created_at')
        return render(request, 'files/file_list.html', {'files': files})


class FileUploadView(LoginRequiredMixin, PermissionRequiredMixin, View):
    permission_required = 'file_sharing.add_fileupload'

    def get(self, request):
        form = FileUploadForm()
        return render(request, 'files/file_upload.html', {'form': form})

    def post(self, request):
        form = FileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file_upload = form.save(commit=False)
            file_upload.user = request.user
            file_upload.save()
            messages.success(request, "File uploaded successfully.")
            return redirect('file_sharing:file_list')

        return render(request, 'files/file_upload.html', {'form': form})


class FileDetailView(LoginRequiredMixin, View):
    def get(self, request, pk):
        file = get_object_or_404(FileUpload, pk=pk)

        if not (file.is_public or file.user == request.user
                or request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files')):
            messages.error(request, 'You don\'t have permission to view this file')
            return redirect('file_sharing:file_list')

        return render(request, 'files/file_detail.html', {'file': file})


class FileUpdateView(LoginRequiredMixin, View):
    def get(self, request, pk):
        file = get_object_or_404(FileUpload, pk=pk)

        if not (file.is_public or file.user == request.user
                or request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files')):
            messages.error(request, 'You don\'t have permission to edit this file')
            return redirect('file_sharing:file_list')

        form = FileUploadForm(instance=file)
        data = {
            'form': form,
            'file': file
        }
        return render(request, 'files/file_update.html', context=data)

    def post(self, request, pk):
        file = get_object_or_404(FileUpload, pk=pk)

        if not (file.is_public or file.user == request.user
                or request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files')):
            messages.error(request, 'You don\'t have permission to edit this file')
            return redirect('file_sharing:file_list')

        form = FileUploadForm(request.POST, request.FILES, instance=file)

        if form.is_valid():
            form.save()
            messages.success(request, "File updated successfully")
            return redirect('file_sharing:file_list')
        return render(request, 'files/file_update.html', {'form': form, 'file': file})


class FileDeleteView(LoginRequiredMixin, View):
    def get(self, request, pk):
        file = get_object_or_404(FileUpload, pk=pk)

        if not (file.is_public or file.user == request.user
                or request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files')):
            messages.error(request, 'You don\'t have permission to delete this file')
            return redirect('file_sharing:file_list')

        return render(request, 'files/file_confirm_delete.html', {'file': file})

    def post(self, request, pk):
        file = get_object_or_404(FileUpload, pk=pk)

        if not (file.is_public or file.user == request.user
                or request.user.is_superuser or request.user.has_perm('file_sharing.view_all_files')):
            messages.error(request, 'You don\'t have permission to delete this file')
            return redirect('file_sharing:file_list')

        file.delete()
        messages.success(request, "File deleted successfully")
        return redirect('file_sharing:file_list')
