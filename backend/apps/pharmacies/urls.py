from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pharmacies', views.PharmacyViewSet)
router.register(r'products', views.PharmacyProductViewSet)

urlpatterns = [
    path('register/', views.PharmacyRegisterView.as_view(), name='pharmacy-register'),
    path('login/', views.PharmacyLoginView.as_view(), name='pharmacy-login'),
    path('approve/<int:pk>/', views.PharmacyApprovalView.as_view(), name='pharmacy-approve'),
    path('', include(router.urls)),
]
