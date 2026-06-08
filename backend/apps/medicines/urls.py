from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.MedicineCategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'medicines', views.MedicineViewSet)
router.register(r'batches', views.MedicineBatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
