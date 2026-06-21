from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ChatMessage, ChatRoom
from .serializers import (
    ChatMessageCreateSerializer,
    ChatMessageSerializer,
    ChatRoomDetailSerializer,
    ChatRoomListSerializer,
)


class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.none()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['room_type', 'task', 'order', 'is_active']
    search_fields = ['name']
    ordering_fields = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ChatRoomListSerializer
        return ChatRoomDetailSerializer

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(members=user).prefetch_related('members', 'messages')

    def perform_create(self, serializer):
        room = serializer.save()
        if self.request.user not in room.members.all():
            room.members.add(self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        msgs = room.messages.select_related('sender').order_by('-created_at')
        page = self.paginate_queryset(msgs)
        if page is not None:
            serializer = ChatMessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ChatMessageSerializer(msgs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        room = self.get_object()
        serializer = ChatMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save(room=room, sender=request.user)
        room.save(update_fields=['updated_at'])
        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        room = self.get_object()
        updated = room.messages.filter(is_read=False).exclude(sender=request.user).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'marked_read': updated})

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        room = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            room.members.add(user)
            return Response({'message': f'{user.get_full_name()} qo\'shildi'})
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def unread_total(self, request):
        rooms = self.get_queryset()
        total = ChatMessage.objects.filter(
            room__in=rooms, is_read=False
        ).exclude(sender=request.user).count()
        return Response({'unread_total': total})


class ChatMessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChatMessage.objects.none()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['room', 'sender', 'is_read']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        user_rooms = ChatRoom.objects.filter(members=self.request.user)
        return ChatMessage.objects.filter(room__in=user_rooms).select_related('sender')
