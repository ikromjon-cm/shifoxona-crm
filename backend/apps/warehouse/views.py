from django.db import models, transaction
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrWarehouse, IsSuperAdmin
from apps.inventory.models import Inventory
from apps.medicines.models import Medicine, MedicineBatch
from apps.pharmacies.models import PharmacyProduct

from .models import (
    ExpenseTransaction,
    IncomeTransaction,
    InventoryMovement,
    PickOrder,
    PickOrderItem,
    PickWave,
    Stock,
    Warehouse,
    WarehouseBin,
    WarehouseRack,
    WarehouseShelf,
    WarehouseZone,
)
from .serializers import (
    ExpenseTransactionCreateSerializer,
    ExpenseTransactionListSerializer,
    IncomeTransactionCreateSerializer,
    IncomeTransactionListSerializer,
    InventoryMovementSerializer,
    PickOrderCreateSerializer,
    PickOrderDetailSerializer,
    PickOrderItemSerializer,
    PickOrderListSerializer,
    PickWaveCreateSerializer,
    PickWaveSerializer,
    StockSerializer,
    WarehouseBinSerializer,
    WarehouseRackSerializer,
    WarehouseSerializer,
    WarehouseShelfSerializer,
    WarehouseZoneSerializer,
)
from .utils.label_printer import generate_bin_label_pdf, generate_sheet_label_pdf
from .utils.print_documents import generate_pick_list_pdf
from .utils.qr_generator import generate_bin_qr_data, generate_qr_base64


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.select_related('company', 'branch')
    serializer_class = WarehouseSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'branch', 'is_active']
    search_fields = ['name', 'code']


class WarehouseZoneViewSet(viewsets.ModelViewSet):
    queryset = WarehouseZone.objects.select_related('warehouse')
    serializer_class = WarehouseZoneSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'is_active']


class WarehouseRackViewSet(viewsets.ModelViewSet):
    queryset = WarehouseRack.objects.select_related('zone__warehouse')
    serializer_class = WarehouseRackSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['zone', 'is_active']


class WarehouseShelfViewSet(viewsets.ModelViewSet):
    queryset = WarehouseShelf.objects.select_related('rack__zone__warehouse')
    serializer_class = WarehouseShelfSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['rack', 'is_active']


class WarehouseBinViewSet(viewsets.ModelViewSet):
    queryset = WarehouseBin.objects.select_related('shelf__rack__zone__warehouse')
    serializer_class = WarehouseBinSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['shelf', 'is_active']

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        bin_obj = self.get_object()
        qr_data = generate_bin_qr_data(bin_obj)
        qr_base64 = generate_qr_base64(qr_data)
        return Response({
            'qr_data': qr_data,
            'qr_base64': f'data:image/png;base64,{qr_base64}',
            'bin_id': bin_obj.id,
            'bin_code': bin_obj.code,
        })

    @action(detail=True, methods=['get'])
    def label(self, request, pk=None):
        bin_obj = self.get_object()
        pdf_buffer = generate_bin_label_pdf(bin_obj)
        return HttpResponse(pdf_buffer.read(), content_type='application/pdf',
                            headers={'Content-Disposition': f'inline; filename="bin_{bin_obj.code}.pdf"'})

    @action(detail=False, methods=['post'])
    def print_labels(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'Bin ID lar talab qilinadi'}, status=400)
        bins = WarehouseBin.objects.filter(id__in=ids)
        pdf_buffer = generate_sheet_label_pdf(bins, 'bin')
        return HttpResponse(pdf_buffer.read(), content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="bin_labels.pdf"'})


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stock.objects.select_related('warehouse_bin__shelf', 'medicine', 'batch')
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['warehouse_bin', 'medicine', 'batch']
    search_fields = ['medicine__name', 'batch__batch_number']

    @action(detail=False, methods=['get'])
    def report(self, request):
        from datetime import timedelta

        from django.db.models import Sum
        from django.utils import timezone

        medicines = Medicine.objects.all()
        total_medicines = medicines.count()
        low_stock_count = medicines.filter(quantity__lte=models.F('min_quantity')).count()
        expiring_soon = MedicineBatch.objects.filter(
            expiry_date__gte=timezone.now().date(),
            expiry_date__lte=timezone.now().date() + timedelta(days=30),
        ).count()
        total_value = medicines.aggregate(v=Sum(models.F('quantity') * models.F('purchase_price')))['v'] or 0

        return Response({
            'total_medicines': total_medicines,
            'low_stock_count': low_stock_count,
            'expiring_soon': expiring_soon,
            'total_value': float(total_value),
        })


class IncomeTransactionViewSet(viewsets.ModelViewSet):
    queryset = IncomeTransaction.objects.all()
    permission_classes = [IsAdminOrWarehouse]
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
            if income.warehouse_bin:
                stock, _ = Stock.objects.select_for_update().get_or_create(
                    warehouse_bin=income.warehouse_bin,
                    medicine=medicine,
                    defaults={'quantity': 0}
                )
                stock.quantity = models.F('quantity') + income.quantity
                stock.save(update_fields=['quantity'])

    @action(detail=False, methods=['post'])
    def scan(self, request):
        barcode = request.data.get('barcode')
        quantity = request.data.get('quantity', 1)
        supplier_id = request.data.get('supplier')
        price = request.data.get('price', 0)
        warehouse_bin_id = request.data.get('warehouse_bin')

        if not barcode:
            return Response({'error': 'Barkod talab qilinadi'}, status=400)

        try:
            medicine = Medicine.objects.get(barcode=barcode, is_active=True)
        except Medicine.DoesNotExist:
            return Response({'error': 'Mahsulot topilmadi'}, status=404)

        data = {
            'medicine': medicine.id,
            'quantity': quantity,
            'price': price,
            'note': f'Barkod skaner: {barcode}',
        }
        if supplier_id:
            data['supplier'] = supplier_id
        if warehouse_bin_id:
            data['warehouse_bin'] = warehouse_bin_id

        serializer = IncomeTransactionCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(IncomeTransactionListSerializer(serializer.instance).data, status=201)

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'Mahsulotlar talab qilinadi'}, status=400)

        results = []
        errors = []
        for item in items:
            try:
                medicine = Medicine.objects.get(id=item.get('medicine_id'), is_active=True)
            except Medicine.DoesNotExist:
                errors.append({'index': len(results), 'error': f"Mahsulot ID {item.get('medicine_id')} topilmadi"})
                continue

            data = {
                'medicine': medicine.id,
                'quantity': item.get('quantity', 1),
                'price': item.get('price', 0),
                'supplier': item.get('supplier') or request.data.get('supplier'),
                'warehouse_bin': item.get('warehouse_bin') or request.data.get('warehouse_bin'),
                'note': 'Ommaviy kirim',
            }
            serializer = IncomeTransactionCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                transaction_obj = serializer.save(created_by=request.user)
                results.append(IncomeTransactionListSerializer(transaction_obj).data)
            else:
                errors.append({'error': serializer.errors, 'item': item})

        return Response({'results': results, 'errors': errors, 'total': len(results), 'failed': len(errors)})


class ExpenseTransactionViewSet(viewsets.ModelViewSet):
    queryset = ExpenseTransaction.objects.all()
    permission_classes = [IsAdminOrWarehouse]
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

    @action(detail=False, methods=['post'])
    def scan(self, request):
        barcode = request.data.get('barcode')
        quantity = request.data.get('quantity', 1)
        pharmacy_id = request.data.get('pharmacy')
        warehouse_bin_id = request.data.get('warehouse_bin')
        reason = request.data.get('reason', '')

        if not barcode:
            return Response({'error': 'Barkod talab qilinadi'}, status=400)

        try:
            medicine = Medicine.objects.get(barcode=barcode, is_active=True)
        except Medicine.DoesNotExist:
            return Response({'error': 'Mahsulot topilmadi'}, status=404)

        data = {
            'medicine': medicine.id,
            'quantity': quantity,
            'reason': reason,
            'note': f'Barkod skaner: {barcode}',
        }
        if pharmacy_id:
            data['pharmacy'] = pharmacy_id
        if warehouse_bin_id:
            data['warehouse_bin'] = warehouse_bin_id

        serializer = ExpenseTransactionCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(ExpenseTransactionListSerializer(serializer.instance).data, status=201)

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'Mahsulotlar talab qilinadi'}, status=400)

        results = []
        errors = []
        for item in items:
            try:
                medicine = Medicine.objects.get(id=item.get('medicine_id'), is_active=True)
            except Medicine.DoesNotExist:
                errors.append({'index': len(results), 'error': f"Mahsulot ID {item.get('medicine_id')} topilmadi"})
                continue

            data = {
                'medicine': medicine.id,
                'quantity': item.get('quantity', 1),
                'pharmacy': item.get('pharmacy') or request.data.get('pharmacy'),
                'warehouse_bin': item.get('warehouse_bin') or request.data.get('warehouse_bin'),
                'reason': item.get('reason', ''),
                'note': 'Ommaviy chiqim',
            }
            serializer = ExpenseTransactionCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                transaction_obj = serializer.save(created_by=request.user)
                results.append(ExpenseTransactionListSerializer(transaction_obj).data)
            else:
                errors.append({'error': serializer.errors, 'item': item})

        return Response({'results': results, 'errors': errors, 'total': len(results), 'failed': len(errors)})


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryMovement.objects.all()
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medicine', 'movement_type', 'created_by']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return InventoryMovement.objects.select_related('medicine', 'created_by')


class PickWaveViewSet(viewsets.ModelViewSet):
    queryset = PickWave.objects.all()
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['warehouse', 'status', 'assigned_to']
    search_fields = ['wave_number', 'note']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PickWaveCreateSerializer
        return PickWaveSerializer

    def get_queryset(self):
        return PickWave.objects.select_related(
            'company', 'branch', 'warehouse', 'assigned_to', 'created_by'
        )

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.company,
            branch=user.branch,
            created_by=user,
            wave_number=f'WAVE-{PickWave.objects.count() + 1:06d}',
        )

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        wave = self.get_object()
        if wave.status != 'pending':
            return Response({'error': 'Faqat kutilayotgan to\'lqinni boshlash mumkin'}, status=400)
        wave.status = 'in_progress'
        wave.started_at = timezone.now()
        wave.save()
        PickOrder.objects.filter(wave=wave, status='pending').update(
            status='in_progress', started_at=timezone.now()
        )
        return Response(PickWaveSerializer(wave).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        wave = self.get_object()
        if wave.status != 'in_progress':
            return Response({'error': 'Faqat jarayondagi to\'lqinni tugatish mumkin'}, status=400)
        pending = PickOrder.objects.filter(wave=wave).exclude(status='picked').count()
        if pending > 0:
            return Response({'error': f'Hali {pending} ta komplektatsiya buyrug\'i bajarilmagan'}, status=400)
        wave.status = 'completed'
        wave.completed_at = timezone.now()
        wave.save()
        return Response(PickWaveSerializer(wave).data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        wave = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id talab qilinadi'}, status=400)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=404)
        wave.assigned_to = user
        wave.save()
        PickOrder.objects.filter(wave=wave, assigned_to__isnull=True).update(assigned_to=user)
        return Response(PickWaveSerializer(wave).data)


class PickOrderViewSet(viewsets.ModelViewSet):
    queryset = PickOrder.objects.all()
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['wave', 'warehouse', 'status', 'strategy', 'assigned_to']
    search_fields = ['pick_number', 'note']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PickOrderCreateSerializer
        if self.action == 'retrieve':
            return PickOrderDetailSerializer
        return PickOrderListSerializer

    def get_queryset(self):
        return PickOrder.objects.select_related(
            'wave', 'warehouse', 'assigned_to', 'created_by'
        ).prefetch_related('items__medicine', 'items__warehouse_bin')

    def perform_create(self, serializer):
        user = self.request.user
        warehouse = serializer.validated_data.get('warehouse')
        strategy = serializer.validated_data.get('strategy', warehouse.picking_strategy)
        pick_order = serializer.save(
            created_by=user,
            pick_number=f'PICK-{PickOrder.objects.count() + 1:06d}',
            strategy=strategy,
        )
        items_data = serializer.validated_data.get('items', [])
        for item_data in items_data:
            medicine = item_data['medicine']
            qty = item_data['quantity']
            batches = Stock.objects.fefo(medicine, pick_order.warehouse, qty)
            for batch_info in batches:
                PickOrderItem.objects.create(
                    pick_order=pick_order,
                    stock=batch_info['stock'],
                    medicine=medicine,
                    batch=batch_info['batch'],
                    warehouse_bin=batch_info['bin'],
                    requested_quantity=batch_info['quantity'],
                )
                batch_info['stock'].reserve(batch_info['quantity'])

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        order = self.get_object()
        order.start()
        return Response(PickOrderDetailSerializer(order).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        order = self.get_object()
        if order.status != 'in_progress':
            return Response({'error': 'Faqat jarayondagi buyruqni tugatish mumkin'}, status=400)
        unpicked = order.items.filter(is_picked=False).count()
        if unpicked > 0:
            return Response({'error': f'Hali {unpicked} ta mahsulot komplektatsiya qilinmagan'}, status=400)
        order.complete()
        return Response(PickOrderDetailSerializer(order).data)

    @action(detail=True, methods=['post'])
    def pick_item(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['in_progress']:
            return Response({'error': 'Buyruq faqat jarayonda bo\'lishi kerak'}, status=400)
        item_id = request.data.get('item_id')
        qty = request.data.get('quantity')
        try:
            item = order.items.get(id=item_id, is_picked=False)
        except PickOrderItem.DoesNotExist:
            return Response({'error': 'Mahsulot topilmadi yoki allaqachon komplektatsiya qilingan'}, status=404)
        item.pick(user=request.user, qty=qty)
        return Response(PickOrderItemSerializer(item).data)

    @action(detail=True, methods=['get'])
    def print_pick_list(self, request, pk=None):
        pick_order = self.get_object()
        pdf_buffer = generate_pick_list_pdf(pick_order)
        return HttpResponse(pdf_buffer.read(), content_type='application/pdf',
                            headers={'Content-Disposition': f'inline; filename="{pick_order.pick_number}.pdf"'})


class PickOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PickOrderItem.objects.all()
    serializer_class = PickOrderItemSerializer
    permission_classes = [IsAdminOrWarehouse]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['pick_order', 'medicine', 'warehouse_bin', 'is_picked', 'picked_by']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return PickOrderItem.objects.select_related(
            'pick_order', 'medicine', 'batch', 'warehouse_bin', 'picked_by'
        )
