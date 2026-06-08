from django.urls import path
from . import views

urlpatterns = [
    path('logs/', views.AuditLogViewSet.as_view({'get': 'list'}), name='auditlog-list'),
    path('logs/<int:pk>/', views.AuditLogViewSet.as_view({'get': 'retrieve'}), name='auditlog-detail'),
]
