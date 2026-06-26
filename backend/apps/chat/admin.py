from django.contrib import admin

from .models import ChatMessage, ChatRoom


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'company', 'branch', 'is_active', 'created_at']
    list_filter = ['room_type', 'is_active']
    search_fields = ['name']
    filter_horizontal = ['members']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['room', 'sender', 'text', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['text', 'sender__login']
    date_hierarchy = 'created_at'
