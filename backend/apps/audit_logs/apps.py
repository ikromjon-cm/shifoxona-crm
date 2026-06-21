from django.apps import AppConfig


class AuditLogsConfig(AppConfig):
    name = 'apps.audit_logs'
    verbose_name = 'Audit yozuvlari'

    def ready(self):
        import apps.audit_logs.signals  # noqa
