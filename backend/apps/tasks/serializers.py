from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Task, TaskAttachment, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['task', 'user', 'created_at']

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class TaskAttachmentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = '__all__'
        read_only_fields = ['created_at']

    @extend_schema_field(serializers.CharField())
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class TaskListSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'task_type', 'task_type_display', 'priority', 'priority_display',
                  'status', 'status_display', 'assigned_by', 'assigned_by_name',
                  'assigned_to', 'assigned_to_name', 'due_date', 'comment_count',
                  'estimated_minutes', 'actual_minutes', 'is_private',
                  'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name()
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_comment_count(self, obj):
        return obj.comments.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name()
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'task_type', 'priority', 'status',
                  'assigned_to', 'order', 'warehouse', 'due_date',
                  'estimated_minutes', 'actual_minutes', 'is_private', 'created_at']
        read_only_fields = ['status', 'actual_minutes', 'created_at']
