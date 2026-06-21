from .middleware import get_current_request


class AuditViewMixin:
    """Mixin for ViewSets that attaches the current request to model instances
    so audit signals can access it."""

    def perform_create(self, serializer):
        request = get_current_request()
        instance = serializer.save()
        if request:
            instance._audit_request = request
            instance.save()

    def perform_update(self, serializer):
        request = get_current_request()
        instance = serializer.save()
        if request:
            instance._audit_request = request
            instance.save()

    def perform_destroy(self, instance):
        request = get_current_request()
        if request:
            instance._audit_request = request
        super().perform_destroy(instance)
