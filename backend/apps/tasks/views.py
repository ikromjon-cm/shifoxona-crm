from django.db import models
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task, TaskAttachment
from .serializers import (
    TaskAttachmentSerializer,
    TaskCommentSerializer,
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('assigned_by', 'assigned_to', 'company', 'branch', 'warehouse', 'order')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'task_type', 'assigned_to', 'assigned_by',
                        'company', 'branch', 'warehouse', 'order', 'is_private', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['-priority', '-created_at', 'due_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaskCreateSerializer
        return TaskDetailSerializer

    def get_queryset(self):
        qs = Task.objects.select_related('assigned_by', 'assigned_to', 'company', 'branch', 'warehouse', 'order')
        user = self.request.user
        if not (user.is_super_admin or user.role == 'admin'):
            qs = qs.filter(
                models.Q(assigned_to=user) | models.Q(assigned_by=user) | models.Q(is_private=False)
            )
        if self.action == 'list':
            qs = qs.prefetch_related('comments')
        elif self.action == 'retrieve':
            qs = qs.prefetch_related('comments', 'attachments')
        return qs

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        if task.status not in ['pending', 'on_hold']:
            return Response({'error': 'Faqat kutilayotgan vazifani boshlash mumkin'}, status=status.HTTP_400_BAD_REQUEST)
        task.start()
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.status != 'in_progress':
            return Response({'error': 'Faqat bajarilayotgan vazifani tugatish mumkin'}, status=status.HTTP_400_BAD_REQUEST)
        task.complete()
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        task = self.get_object()
        task.status = 'cancelled'
        task.save()
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Fayl talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        attachment = TaskAttachment.objects.create(
            task=task,
            user=request.user,
            file=file,
            filename=file.name,
            file_size=file.size,
        )
        serializer = TaskAttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        tasks = self.get_queryset().filter(assigned_to=request.user, is_active=True)
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = TaskListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        base_qs = Task.objects.all()
        if not (user.is_super_admin or user.role == 'admin'):
            base_qs = base_qs.filter(models.Q(assigned_to=user) | models.Q(assigned_by=user))
        return Response({
            'pending': base_qs.filter(status='pending').count(),
            'in_progress': base_qs.filter(status='in_progress').count(),
            'completed': base_qs.filter(status='completed').count(),
            'cancelled': base_qs.filter(status='cancelled').count(),
            'overdue': base_qs.filter(status__in=['pending', 'in_progress'], due_date__lt=timezone.now()).count(),
        })
