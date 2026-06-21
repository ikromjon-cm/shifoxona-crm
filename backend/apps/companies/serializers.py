from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Branch, Company, Department, Position


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CompanyDetailSerializer(serializers.ModelSerializer):
    branches_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = '__all__'

    @extend_schema_field(serializers.IntegerField())
    def get_branches_count(self, obj):
        return obj.branches.count()


class BranchSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Branch
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Department
        fields = '__all__'


class PositionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Position
        fields = '__all__'
