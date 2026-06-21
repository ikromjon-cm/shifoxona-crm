from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import ChatMessage, ChatRoom


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['created_at', 'read_at']

    @extend_schema_field(serializers.CharField())
    def get_sender_name(self, obj):
        return obj.sender.get_full_name()


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['text', 'file']


class ChatRoomListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'room_type', 'last_message', 'unread_count',
                  'member_count', 'is_active', 'created_at', 'updated_at']

    @extend_schema_field(serializers.DictField(allow_null=True))
    def get_last_message(self, obj):
        msg = obj.last_message()
        if msg:
            return ChatMessageSerializer(msg).data
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    @extend_schema_field(serializers.IntegerField())
    def get_member_count(self, obj):
        return obj.members.count()


class ChatRoomDetailSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = '__all__'

    @extend_schema_field(serializers.ListField())
    def get_members(self, obj):
        return [{'id': m.id, 'name': m.get_full_name(), 'role': m.role} for m in obj.members.all()]

    @extend_schema_field(serializers.DictField(allow_null=True))
    def get_last_message(self, obj):
        msg = obj.last_message()
        if msg:
            return ChatMessageSerializer(msg).data
        return None
