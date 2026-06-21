from django.db import models
from django.utils import timezone


class SoftDeleteMixin(models.Model):
    """Adds is_deleted and deleted_at fields for soft delete functionality."""
    is_deleted = models.BooleanField(default=False, verbose_name='O\'chirilgan')
    deleted_at = models.DateTimeField(blank=True, null=True, verbose_name='O\'chirilgan vaqt')

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class TimestampMixin(models.Model):
    """Adds created_at and updated_at fields."""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        abstract = True


class BaseModel(SoftDeleteMixin, TimestampMixin):
    """Base model with all common fields."""

    class Meta:
        abstract = True
