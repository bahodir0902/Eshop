from django.urls import path
from accounts.views import *

app_name = 'accounts'
urlpatterns = [
    path('login/', Login.as_view(), name='login'),
    path('register/', Register.as_view(), name='register'),
    path('logout/', Logout.as_view(), name='logout'),
    path('verify_email/', VerifyRegistration.as_view(), name='verify_email'),
    path('forgot_password/', ForgotPassword.as_view(), name="forgot_password"),
    path('check_email/', CheckEmail.as_view(), name='check_email'),
    path('create_new_password/', CreateNewPassword.as_view(), name="create_new_password"),
    path('profile/', Profile.as_view(), name='profile'),
    path('profile/edit/', ProfileEdit.as_view(), name='profile_edit'),
    path('verify_email_to_change_email/', VerifyEmailToChangeEmail.as_view(), name='VerifyEmailToChangeEmail')

]