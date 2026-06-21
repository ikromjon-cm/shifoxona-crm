from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'geofence-zones', views.GeofenceZoneViewSet)
router.register(r'shifts', views.ShiftViewSet)
router.register(r'records', views.AttendanceRecordViewSet)
router.register(r'sessions', views.AttendanceSessionViewSet)
router.register(r'leave-requests', views.LeaveRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
