from django.urls import path

from . import views

urlpatterns = [
    path('notifications/', views.NotificationViewSet.as_view({'get': 'list'}), name='notification-list'),
    path('notifications/unread-count/', views.NotificationViewSet.as_view({'get': 'unread_count'}), name='notification-unread-count'),
    path('notifications/<int:pk>/mark-read/', views.NotificationViewSet.as_view({'post': 'mark_read'}), name='notification-mark-read'),
    path('notifications/mark-all-read/', views.NotificationViewSet.as_view({'post': 'mark_all_read'}), name='notification-mark-all-read'),
    path('settings/', views.NotificationSettingView.as_view(), name='notification-settings'),
    path('device-token/', views.DeviceTokenView.as_view(), name='device-token'),
]
