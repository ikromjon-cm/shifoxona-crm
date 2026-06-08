from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'inventory', views.InventoryViewSet)
router.register(r'counts', views.InventoryCountViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
