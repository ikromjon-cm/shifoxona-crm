from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'inventory', views.InventoryViewSet)
router.register(r'counts', views.InventoryCountViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
