from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsSuperAdmin

from .models import Permission, Role, UserRole
from .serializers import PermissionSerializer, RoleDetailSerializer, RoleSerializer, UserRoleSerializer


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['model_name', 'action']
    search_fields = ['model_name', 'action', 'description']


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoleDetailSerializer
        return RoleSerializer

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        role = self.get_object()
        role.is_active = not role.is_active
        role.save()
        return Response({'status': 'ok', 'is_active': role.is_active})

    @action(detail=False, methods=['post'])
    def create_system_roles(self, request):
        system_roles = [
            {'name': 'Super Admin', 'code': 'superadmin', 'description': 'To\'liq huquqli administrator'},
            {'name': 'Admin', 'code': 'admin', 'description': 'Kompaniya administratori'},
            {'name': 'Omborchi', 'code': 'warehouse', 'description': 'Ombor xodimi'},
            {'name': 'Haydovchi', 'code': 'driver', 'description': 'Yetkazib berish haydovchisi'},
            {'name': 'Operator', 'code': 'operator', 'description': 'Buyurtmalar operatori'},
            {'name': 'Moliya', 'code': 'finance', 'description': 'Moliya bo\'limi'},
            {'name': 'Dorixona', 'code': 'pharmacy', 'description': 'Dorixona foydalanuvchisi'},
        ]
        created = []
        for role_data in system_roles:
            role, is_new = Role.objects.get_or_create(
                code=role_data['code'],
                defaults={**role_data, 'is_system': True}
            )
            if is_new:
                created.append(role.code)
        return Response({'status': 'ok', 'created': created})


class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.select_related('user', 'role', 'company', 'branch').all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'role', 'company', 'branch', 'is_active']
    search_fields = ['user__login', 'role__name']
    ordering_fields = ['assigned_at']

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        ur = self.get_object()
        ur.is_active = not ur.is_active
        ur.save()
        return Response({'status': 'ok', 'is_active': ur.is_active})
