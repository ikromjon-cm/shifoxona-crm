from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'deliveries', views.DeliveryViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
]
