from django.urls import path
from accounts.views import *

app_name = 'accounts'
urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/google/', GoogleLoginView.as_view(), name="google_login"),
    path('login/google/callback/', GoogleCallBackView.as_view(), name="google_callback"),
    path('forgot-password/', ForgotPassword.as_view(), name='forgot_password'),
    path('check-email/', CheckEmailView.as_view(), name='check_email'),
    path('create-new-password/', CreateNewPasswordView.as_view(), name='create_new_password'),
    path('profile/', ProfileView.as_view(), name='profile'),
    # path('profile_edit/', ProfileEditView.as_view(), name='profile_edit')
]