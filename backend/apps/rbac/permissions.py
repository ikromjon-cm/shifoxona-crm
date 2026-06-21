from rest_framework import permissions

from apps.rbac.models import Permission, Role, UserRole

ACTION_MAP = {
    'GET': 'view',
    'HEAD': 'view',
    'OPTIONS': 'view',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete',
}


class HasRbacPermission(permissions.BasePermission):
    """Check permission against RBAC tables (UserRole → Role → Permission).

    Usage:
        permission_classes = [HasRbacPermission('medicine')]
        permission_classes = [HasRbacPermission('medicine', 'create')]
        permission_classes = [HasRbacPermission('medicine', ['view', 'update'])]
        permission_classes = [HasRbacPermission(['medicine', 'order'])]
    """

    def __init__(self, model_names=None, actions=None):
        self.model_names = [model_names] if isinstance(model_names, str) else (model_names or [])
        if isinstance(actions, str):
            self.actions = [actions]
        elif actions is None:
            self.actions = None
        else:
            self.actions = list(actions)

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        model_names = self.model_names
        if not model_names:
            model_names = self._infer_model_name(view)

        action = self.actions
        if action is None:
            action = [ACTION_MAP.get(request.method, 'view')]

        user_roles = UserRole.objects.filter(
            user=request.user, is_active=True
        ).select_related('role')

        if not user_roles.exists():
            return False

        role_ids = list(user_roles.values_list('role_id', flat=True))
        roles = Role.objects.filter(id__in=role_ids, is_active=True)

        allowed_perms = set()
        for role in roles:
            for p in role.permissions.all():
                allowed_perms.add((p.model_name, p.action))

        for m in model_names:
            for a in action:
                if (m, a) in allowed_perms:
                    return True

        return False

    def _infer_model_name(self, view):
        """Try to guess the model name from the view's queryset or serializer."""
        if hasattr(view, 'queryset') and view.queryset is not None:
            model = getattr(view.queryset, 'model', None)
        elif hasattr(view, 'serializer_class') and view.serializer_class is not None:
            meta = getattr(view.serializer_class, 'Meta', None)
            model = getattr(meta, 'model', None) if meta else None
        else:
            model = None

        if model is not None:
            return [model._meta.model_name]

        return []
