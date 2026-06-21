import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../data/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/notifications/notifications/');
});

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('notification.title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/notification-preferences'),
          ),
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              try {
                await ApiService.post('/notifications/notifications/mark-all-read/');
                ref.invalidate(notificationsProvider);
              } catch (_) {}
            },
          ),
        ],
      ),
      body: notifications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
        data: (items) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(notificationsProvider),
          child: items.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.notifications_none, size: 64, color: Color(AppTheme.textSecondary)),
                const SizedBox(height: 12), Text(TranslationService.tr('notification.empty')),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final n = items[index];
                  final isRead = n['is_read'] == true;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: isRead ? Colors.grey.withValues(alpha: 0.1) : const Color(AppTheme.primaryColor).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          n['type'] == 'medicine' ? Icons.medication : n['type'] == 'order' ? Icons.shopping_cart : Icons.notifications,
                          color: isRead ? Colors.grey : const Color(AppTheme.primaryColor),
                        ),
                      ),
                      title: Text(n['title'] ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold)),
                      subtitle: Text(n['message'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                      trailing: Text(_timeAgo(n['created_at'] ?? ''), style: const TextStyle(fontSize: 11, color: Color(AppTheme.textSecondary))),
                    ),
                  );
                },
              ),
        ),
      ),
    );
  }

  String _timeAgo(String iso) {
    if (iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}k';
  }
}
