from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'income', views.IncomeTransactionViewSet)
router.register(r'expense', views.ExpenseTransactionViewSet)
router.register(r'movements', views.InventoryMovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
