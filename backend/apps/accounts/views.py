import random
import string
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from .permissions import IsAdmin, IsSuperAdmin
from .serializers import (
    ForgotPasswordSerializer, LoginSerializer, RegisterSerializer,
    ResetPasswordSerializer, UserCreateSerializer, UserSerializer, get_tokens_for_user,
)
from .models import PasswordResetCode

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsSuperAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'message': 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz',
            'tokens': tokens,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        from apps.audit_logs.models import AuditLog
        AuditLog.objects.create(
            user=user,
            action='LOGIN',
            description='Tizimga kirdi',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            'message': 'Muvaffaqiyatli tizimga kirdingiz',
            'tokens': tokens,
            'user': UserSerializer(user).data
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['first_name', 'last_name', 'login', 'phone']
    ordering_fields = ['created_at', 'first_name', 'last_name']


class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsSuperAdmin]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]


@extend_schema(exclude=True)
class UserBlockView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.is_super_admin:
                return Response({'error': 'Super Adminni bloklab bo\'lmaydi'}, status=status.HTTP_400_BAD_REQUEST)
            user.block()
            return Response({'message': 'Foydalanuvchi bloklandi'})
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(exclude=True)
class UserUnblockView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.unblock()
            return Response({'message': 'Foydalanuvchi blokdan chiqarildi'})
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(exclude=True)
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Eski va yangi parol talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({'error': 'Eski parol noto\'g\'ri'}, status=status.HTTP_400_BAD_REQUEST)
        if old_password == new_password:
            return Response({'error': 'Yangi parol eskisidan farqli bo\'lishi kerak'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Parol muvaffaqiyatli o\'zgartirildi'})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(login=serializer.validated_data['login'])

        code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=15)

        PasswordResetCode.objects.create(user=user, code=code, expires_at=expires_at)

        return Response({
            'message': 'Tiklash kodi yuborildi',
            'code': code,
            'expires_in': 15,
        })


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        reset = serializer.validated_data['reset']
        new_password = serializer.validated_data['new_password']

        user.set_password(new_password)
        user.save()
        reset.is_used = True
        reset.save()

        return Response({'message': 'Parol muvaffaqiyatli tiklandi'})


from django.db.models import F
from rest_framework.viewsets import ViewSet

from apps.medicines.models import Medicine
from apps.orders.models import Order
from apps.tasks.models import Task


@extend_schema(exclude=True)
class DashboardViewSet(ViewSet):
    permission_classes = [IsAdmin]

    def list(self, request):
        medicines = Medicine.objects.all()
        orders = Order.objects.all()
        tasks = Task.objects.all()
        users = get_user_model().objects.filter(is_active=True, is_blocked=False)

        return Response({
            'medicines': medicines.count(),
            'orders': orders.count(),
            'tasks': tasks.count(),
            'users': users.count(),
            'low_stock': medicines.filter(quantity__lte=F('min_quantity')).count(),
            'pending_orders': orders.filter(status='pending').count(),
            'active_tasks': tasks.filter(status='in_progress').count(),
        })
