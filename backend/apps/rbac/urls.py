from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'permissions', views.PermissionViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'user-roles', views.UserRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
