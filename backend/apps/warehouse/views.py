from rest_framework import viewsets, filters
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction, models
from .models import IncomeTransaction, ExpenseTransaction, InventoryMovement
from .serializers import (
    IncomeTransactionListSerializer, IncomeTransactionCreateSerializer,
    ExpenseTransactionListSerializer, ExpenseTransactionCreateSerializer,
    InventoryMovementSerializer
)
from apps.accounts.permissions import IsSuperAdmin
from apps.inventory.models import Inventory
from apps.medicines.models import Medicine
from apps.pharmacies.models import PharmacyProduct


class IncomeTransactionViewSet(viewsets.ModelViewSet):
    queryset = IncomeTransaction.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['medicine', 'supplier', 'created_by']
    search_fields = ['medicine__name', 'supplier__name', 'note']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return IncomeTransactionCreateSerializer
        return IncomeTransactionListSerializer

    def get_queryset(self):
        return IncomeTransaction.objects.select_related('medicine', 'supplier', 'created_by')

    def get_permissions(self):
        user = self.request.user
        if user.is_authenticated and (user.is_super_admin or user.is_operator):
            if self.action in ['destroy', 'update', 'partial_update']:
                return [IsSuperAdmin()]
            return [IsAuthenticated()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        with transaction.atomic():
            income = serializer.save(created_by=self.request.user)
            medicine = Medicine.objects.select_for_update().get(pk=income.medicine.pk)
            quantity_before = medicine.quantity
            medicine.quantity = models.F('quantity') + income.quantity
            medicine.save(update_fields=['quantity'])
            medicine.refresh_from_db()
            Inventory.objects.update_or_create(
                medicine=medicine,
                defaults={'quantity': medicine.quantity, 'min_quantity': medicine.min_quantity}
            )
            InventoryMovement.objects.create(
                medicine=medicine,
                movement_type='income',
                quantity=income.quantity,
                quantity_before=quantity_before,
                quantity_after=medicine.quantity,
                reference_type='IncomeTransaction',
                reference_id=income.id,
                note=income.note,
                created_by=self.request.user
            )


class ExpenseTransactionViewSet(viewsets.ModelViewSet):
    queryset = ExpenseTransaction.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['medicine', 'pharmacy', 'created_by']
    search_fields = ['medicine__name', 'pharmacy__name', 'reason', 'note']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExpenseTransactionCreateSerializer
        return ExpenseTransactionListSerializer

    def get_queryset(self):
        return ExpenseTransaction.objects.select_related('medicine', 'pharmacy', 'created_by')

    def get_permissions(self):
        user = self.request.user
        if user.is_authenticated and (user.is_super_admin or user.is_operator):
            if self.action in ['destroy', 'update', 'partial_update']:
                return [IsSuperAdmin()]
            return [IsAuthenticated()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        with transaction.atomic():
            expense = serializer.save(created_by=self.request.user)
            medicine = Medicine.objects.select_for_update().get(pk=expense.medicine.pk)
            if medicine.quantity < expense.quantity:
                raise ValidationError({'error': f'Omborda yetarli mahsulot yo\'q. Mavjud: {medicine.quantity}'})
            quantity_before = medicine.quantity
            medicine.quantity = models.F('quantity') - expense.quantity
            medicine.save(update_fields=['quantity'])
            medicine.refresh_from_db()
            Inventory.objects.update_or_create(
                medicine=medicine,
                defaults={'quantity': medicine.quantity, 'min_quantity': medicine.min_quantity}
            )
            InventoryMovement.objects.create(
                medicine=medicine,
                movement_type='expense',
                quantity=expense.quantity,
                quantity_before=quantity_before,
                quantity_after=medicine.quantity,
                reference_type='ExpenseTransaction',
                reference_id=expense.id,
                note=expense.note,
                created_by=self.request.user
            )
            if expense.pharmacy:
                pp, created = PharmacyProduct.objects.select_for_update().get_or_create(
                    pharmacy=expense.pharmacy,
                    medicine=medicine,
                    defaults={'quantity': expense.quantity}
                )
                if not created:
                    pp.quantity = models.F('quantity') + expense.quantity
                    pp.save(update_fields=['quantity'])


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryMovement.objects.all()
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medicine', 'movement_type', 'created_by']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return InventoryMovement.objects.select_related('medicine', 'created_by')
