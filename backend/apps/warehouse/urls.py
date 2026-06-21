from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'warehouses', views.WarehouseViewSet)
router.register(r'zones', views.WarehouseZoneViewSet)
router.register(r'racks', views.WarehouseRackViewSet)
router.register(r'shelves', views.WarehouseShelfViewSet)
router.register(r'bins', views.WarehouseBinViewSet)
router.register(r'stocks', views.StockViewSet)
router.register(r'income', views.IncomeTransactionViewSet)
router.register(r'expense', views.ExpenseTransactionViewSet)
router.register(r'movements', views.InventoryMovementViewSet)
router.register(r'pick-waves', views.PickWaveViewSet)
router.register(r'pick-orders', views.PickOrderViewSet)
router.register(r'pick-items', views.PickOrderItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
