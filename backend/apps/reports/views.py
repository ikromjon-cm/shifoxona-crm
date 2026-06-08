import io
import csv
from datetime import datetime, timedelta
from django.db import models
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from .models import Report
from .serializers import ReportSerializer, ReportGenerateSerializer
from apps.warehouse.models import IncomeTransaction, ExpenseTransaction
from apps.inventory.models import Inventory
from apps.medicines.models import Medicine, MedicineBatch
from apps.pharmacies.models import Pharmacy


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    ordering_fields = ['-created_at']

    def get_queryset(self):
        return Report.objects.select_related('created_by')

    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = ReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report_type = serializer.validated_data['report_type']
        file_format = serializer.validated_data.get('file_format', 'xlsx')
        params = serializer.validated_data

        if file_format == 'xlsx':
            file_data, filename = self._generate_excel(report_type, params)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif file_format == 'csv':
            file_data, filename = self._generate_csv(report_type, params)
            content_type = 'text/csv'
        else:
            return Response({'error': 'Not supported format'}, status=status.HTTP_400_BAD_REQUEST)

        Report.objects.create(
            title=f'{report_type}_{timezone.now().date()}',
            report_type=report_type,
            file_format=file_format,
            filters=params,
            created_by=request.user,
            is_ready=True
        )

        response = HttpResponse(file_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _generate_excel(self, report_type, params):
        wb = Workbook()
        ws = wb.active
        ws.title = 'Hisobot'

        header_font = Font(bold=True, color='FFFFFF', size=12)
        header_fill = PatternFill(start_color='1A73E8', end_color='1A73E8', fill_type='solid')

        if report_type == 'income':
            data = self._get_income_data(params)
            headers = ['ID', 'Mahsulot', 'Yetkazib beruvchi', 'Miqdor', 'Narx', 'Jami summa', 'Sana', 'Kim qabul qilgan']
            ws.append(headers)
            for row in data:
                ws.append(row)

        elif report_type == 'expense':
            data = self._get_expense_data(params)
            headers = ['ID', 'Mahsulot', 'Dorixona', 'Miqdor', 'Narx', 'Jami summa', 'Sana', 'Kim bergan']
            ws.append(headers)
            for row in data:
                ws.append(row)

        elif report_type == 'inventory':
            data = self._get_inventory_data(params)
            headers = ['ID', 'Mahsulot', 'Barcode', 'Miqdor', 'Minimal miqdor']
            ws.append(headers)
            for row in data:
                ws.append(row)

        elif report_type == 'expiry':
            data = self._get_expiry_data(params)
            headers = ['ID', 'Mahsulot', 'Seriya', 'Miqdor', 'Yaroqlilik muddati']
            ws.append(headers)
            for row in data:
                ws.append(row)

        else:
            ws.append(['Ma\'lumot topilmadi'])

        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center')

        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            ws.column_dimensions[column_letter].width = min(max_length + 2, 50)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue(), f'{report_type}_hisobot_{timezone.now().date()}.xlsx'

    def _generate_csv(self, report_type, params):
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == 'income':
            writer.writerow(['ID', 'Mahsulot', 'Yetkazib beruvchi', 'Miqdor', 'Narx', 'Jami summa', 'Sana', 'Kim qabul qilgan'])
            for row in self._get_income_data(params):
                writer.writerow(row)
        elif report_type == 'expense':
            writer.writerow(['ID', 'Mahsulot', 'Dorixona', 'Miqdor', 'Narx', 'Jami summa', 'Sana', 'Kim bergan'])
            for row in self._get_expense_data(params):
                writer.writerow(row)
        else:
            writer.writerow(['Ma\'lumot topilmadi'])

        output.seek(0)
        return output.getvalue().encode('utf-8'), f'{report_type}_hisobot_{timezone.now().date()}.csv'

    def _get_income_data(self, params):
        qs = IncomeTransaction.objects.select_related('medicine', 'supplier', 'created_by')
        if params.get('start_date'):
            qs = qs.filter(created_at__date__gte=params['start_date'])
        if params.get('end_date'):
            qs = qs.filter(created_at__date__lte=params['end_date'])
        data = []
        for t in qs:
            data.append([
                t.id, t.medicine.name,
                t.supplier.name if t.supplier else '-',
                t.quantity, float(t.price), float(t.total_amount),
                t.created_at.strftime('%Y-%m-%d %H:%M'),
                f"{t.created_by.first_name} {t.created_by.last_name}" if t.created_by else '-'
            ])
        return data

    def _get_expense_data(self, params):
        qs = ExpenseTransaction.objects.select_related('medicine', 'pharmacy', 'created_by')
        if params.get('start_date'):
            qs = qs.filter(created_at__date__gte=params['start_date'])
        if params.get('end_date'):
            qs = qs.filter(created_at__date__lte=params['end_date'])
        data = []
        for t in qs:
            data.append([
                t.id, t.medicine.name,
                t.pharmacy.name if t.pharmacy else '-',
                t.quantity, float(t.price), float(t.total_amount),
                t.created_at.strftime('%Y-%m-%d %H:%M'),
                f"{t.created_by.first_name} {t.created_by.last_name}" if t.created_by else '-'
            ])
        return data

    def _get_inventory_data(self, params):
        qs = Inventory.objects.select_related('medicine').all()
        data = []
        for inv in qs:
            data.append([inv.id, inv.medicine.name, inv.medicine.barcode, inv.quantity, inv.min_quantity])
        return data

    def _get_expiry_data(self, params):
        qs = MedicineBatch.objects.filter(quantity__gt=0).select_related('medicine')
        data = []
        for batch in qs:
            data.append([batch.id, batch.medicine.name, batch.series_number, batch.quantity, batch.expiry_date])
        return data


class DashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_medicines = Medicine.objects.count()
        total_quantity = Medicine.objects.aggregate(models.Sum('quantity'))['quantity__sum'] or 0
        today_income = IncomeTransaction.objects.filter(created_at__date=timezone.now().date()).count()
        today_expense = ExpenseTransaction.objects.filter(created_at__date=timezone.now().date()).count()
        low_stock = Medicine.objects.filter(quantity__lte=models.F('min_quantity')).count()
        total_pharmacies = Pharmacy.objects.filter(is_active=True).count()

        expiring_soon = MedicineBatch.objects.filter(
            expiry_date__lte=timezone.now().date() + timedelta(days=30),
            quantity__gt=0
        ).count()

        top_medicines = ExpenseTransaction.objects.values(
            'medicine__name'
        ).annotate(
            total_qty=models.Sum('quantity'),
            total_amount=models.Sum('total_amount')
        ).order_by('-total_qty')[:10]

        monthly_income = IncomeTransaction.objects.filter(
            created_at__year=timezone.now().year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=models.Sum('total_amount'),
            count=models.Count('id')
        ).order_by('month')

        monthly_expense = ExpenseTransaction.objects.filter(
            created_at__year=timezone.now().year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=models.Sum('total_amount'),
            count=models.Count('id')
        ).order_by('month')

        return Response({
            'total_medicines': total_medicines,
            'total_quantity': total_quantity,
            'today_income': today_income,
            'today_expense': today_expense,
            'low_stock': low_stock,
            'total_pharmacies': total_pharmacies,
            'expiring_soon': expiring_soon,
            'top_medicines': list(top_medicines),
            'monthly_income': list(monthly_income),
            'monthly_expense': list(monthly_expense),
        })
