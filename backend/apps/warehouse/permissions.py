from rest_framework import permissions


class CanCreateIncome(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_super_admin or request.user.is_operator)


class CanCreateExpense(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_super_admin or request.user.is_operator)
