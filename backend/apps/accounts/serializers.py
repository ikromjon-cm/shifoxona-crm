from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PasswordResetCode, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'login', 'password', 'first_name', 'last_name', 'phone', 'position']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data.get('login')
        password = data.get('password')

        if login and password:
            user = authenticate(request=self.context.get('request'), login=login, password=password)
            if not user:
                raise serializers.ValidationError('Login yoki parol noto\'g\'ri')
            if user.is_blocked:
                raise serializers.ValidationError('Siz bloklangansiz')
            if not user.is_active:
                raise serializers.ValidationError('Siz faol emassiz')
        else:
            raise serializers.ValidationError('Login va parol talab qilinadi')

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'first_name', 'last_name', 'phone', 'role', 'position', 'is_active', 'is_blocked', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_superadmin', 'is_operator']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'login', 'password', 'first_name', 'last_name', 'phone', 'role', 'position']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class ForgotPasswordSerializer(serializers.Serializer):
    login = serializers.CharField()

    def validate_login(self, value):
        try:
            User.objects.get(login=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Bunday foydalanuvchi topilmadi')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    login = serializers.CharField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(login=data['login'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Bunday foydalanuvchi topilmadi')

        from django.utils import timezone
        reset = PasswordResetCode.objects.filter(
            user=user, code=data['code'], is_used=False, expires_at__gte=timezone.now()
        ).first()
        if not reset:
            raise serializers.ValidationError('Kod noto\'g\'ri yoki muddati o\'tgan')

        data['user'] = user
        data['reset'] = reset
        return data


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
