from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdmin

from .models import Branch, Company, Department, Position
from .serializers import (
    BranchSerializer,
    CompanyDetailSerializer,
    CompanySerializer,
    DepartmentSerializer,
    PositionSerializer,
)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'inn', 'phone']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CompanyDetailSerializer
        return CompanySerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    serializer_class = BranchSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['branch']
    search_fields = ['name', 'code']
    serializer_class = DepartmentSerializer


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department']
    search_fields = ['name', 'code']
    serializer_class = PositionSerializer
