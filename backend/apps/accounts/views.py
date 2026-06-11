from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserCreateSerializer, get_tokens_for_user
)
from .permissions import IsSuperAdmin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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


class UserUnblockView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.unblock()
            return Response({'message': 'Foydalanuvchi blokdan chiqarildi'})
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)


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
