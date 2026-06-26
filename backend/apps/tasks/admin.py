from django.contrib import admin

from .models import Task, TaskAttachment, TaskComment


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'task_type', 'priority', 'status', 'assigned_to', 'assigned_by', 'due_date', 'created_at']
    list_filter = ['task_type', 'priority', 'status', 'is_active']
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'text', 'created_at']
    search_fields = ['text', 'user__login']
    date_hierarchy = 'created_at'


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'filename', 'file_size', 'created_at']
    search_fields = ['filename']
