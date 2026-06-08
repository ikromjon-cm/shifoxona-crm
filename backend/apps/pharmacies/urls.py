from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pharmacies', views.PharmacyViewSet)
router.register(r'products', views.PharmacyProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
