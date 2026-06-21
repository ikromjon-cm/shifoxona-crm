from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyViewSet)
router.register(r'branches', views.BranchViewSet)
router.register(r'departments', views.DepartmentViewSet)
router.register(r'positions', views.PositionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
