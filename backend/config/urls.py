from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

api_prefix = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),
    path(f'{api_prefix}accounts/', include('apps.accounts.urls')),
    path(f'{api_prefix}medicines/', include('apps.medicines.urls')),
    path(f'{api_prefix}warehouse/', include('apps.warehouse.urls')),
    path(f'{api_prefix}pharmacies/', include('apps.pharmacies.urls')),
    path(f'{api_prefix}inventory/', include('apps.inventory.urls')),
    path(f'{api_prefix}reports/', include('apps.reports.urls')),
    path(f'{api_prefix}notifications/', include('apps.notifications.urls')),
    path(f'{api_prefix}orders/', include('apps.orders.urls')),
    path(f'{api_prefix}delivery/', include('apps.delivery.urls')),
    path(f'{api_prefix}audit-logs/', include('apps.audit_logs.urls')),

    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
