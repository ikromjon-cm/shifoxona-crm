from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


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


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
