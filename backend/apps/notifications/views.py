from django.db import models
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import DeviceToken, Notification, NotificationSetting
from .serializers import DeviceTokenSerializer, NotificationSerializer, NotificationSettingSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.none()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        if self.request.user.is_anonymous:
            return Notification.objects.none()
        user = self.request.user
        if user.is_authenticated and user.is_super_admin:
            return Notification.objects.all()
        return Notification.objects.filter(models.Q(user=user) | models.Q(user__isnull=True))

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'message': 'Bildirishnoma o\'qilgan deb belgilandi'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': 'Barcha bildirishnomalar o\'qilgan deb belgilandi'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})


class NotificationSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = NotificationSetting.objects.get_or_create(user=self.request.user)
        return obj


class DeviceTokenView(generics.CreateAPIView):
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        token = serializer.save()
        return Response(DeviceTokenSerializer(token).data, status=status.HTTP_201_CREATED)
