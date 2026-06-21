from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin

from .models import AttendanceRecord, AttendanceSession, GeofenceZone, LeaveRequest, Shift
from .serializers import (
    AttendanceRecordCreateSerializer,
    AttendanceRecordSerializer,
    AttendanceSessionSerializer,
    GeofenceZoneSerializer,
    LeaveRequestCreateSerializer,
    LeaveRequestSerializer,
    ShiftSerializer,
)


class GeofenceZoneViewSet(viewsets.ModelViewSet):
    queryset = GeofenceZone.objects.select_related('company', 'branch')
    serializer_class = GeofenceZoneSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'branch', 'zone_type', 'is_active']
    search_fields = ['name', 'address']


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related('company', 'branch')
    serializer_class = ShiftSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company', 'branch', 'is_active']


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('user', 'shift', 'geofence_zone')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'attendance_type', 'status', 'method', 'shift', 'geofence_zone']
    ordering_fields = ['-timestamp']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AttendanceRecordCreateSerializer
        return AttendanceRecordSerializer

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related('user', 'shift', 'geofence_zone')
        user = self.request.user
        if user.is_super_admin:
            return qs
        return qs.filter(user=user)

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        return self._check(request, 'check_in')

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        return self._check(request, 'check_out')

    def _check(self, request, att_type):
        data = request.data.copy()
        data['attendance_type'] = att_type
        serializer = AttendanceRecordCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = serializer.save(user=request.user)
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        records = self.get_queryset().filter(timestamp__date=today)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)


class AttendanceSessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceSession.objects.select_related('user', 'shift', 'geofence_zone', 'check_in', 'check_out')
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related('user', 'shift', 'geofence_zone', 'check_in', 'check_out')
        user = self.request.user
        if user.is_super_admin:
            return qs
        return qs.filter(user=user)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('user', 'approved_by')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'leave_type', 'user']
    search_fields = ['reason', 'user__first_name', 'user__last_name']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related('user', 'approved_by')
        user = self.request.user
        if user.is_super_admin or user.role == 'admin':
            return qs
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Faqat kutilayotgan so\'rovni tasdiqlash mumkin'}, status=400)
        leave.approve(request.user)
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Faqat kutilayotgan so\'rovni bekor qilish mumkin'}, status=400)
        reason = request.data.get('reason', '')
        leave.reject(request.user, reason)
        return Response(LeaveRequestSerializer(leave).data)
