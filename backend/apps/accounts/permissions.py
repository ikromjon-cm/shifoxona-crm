from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'superadmin'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin')


class IsOperator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'operator')


class IsWarehouse(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'warehouse')


class IsDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'driver')


class IsFinance(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'finance')


class IsPharmacy(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'pharmacy'


class IsSuperAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'superadmin'


class IsAdminOrFinance(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'finance')


class IsAdminOrWarehouse(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'warehouse')


class IsAdminOrOperator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'operator')


class CanViewDeliveries(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'operator', 'driver', 'pharmacy')


class IsAdminOrOperatorOrPharmacy(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'operator', 'pharmacy')


class CanManageMedicines(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'operator', 'warehouse', 'finance', 'pharmacy')


class IsAdminOrDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('superadmin', 'admin', 'driver')


class IsOwnerOrSuperAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated and request.user.role == 'superadmin':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'driver'):
            return obj.driver == request.user
        return obj == request.user
