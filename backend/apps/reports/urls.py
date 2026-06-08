from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('reports/', views.ReportViewSet.as_view({'get': 'list'}), name='report-list'),
    path('reports/<int:pk>/', views.ReportViewSet.as_view({'get': 'retrieve'}), name='report-detail'),
    path('reports/generate/', views.ReportViewSet.as_view({'post': 'generate'}), name='report-generate'),
]
