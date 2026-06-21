import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/shimmer_list.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final pickOrdersProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/pick-orders/');
});

class PickOrdersPage extends ConsumerStatefulWidget {
  const PickOrdersPage({super.key});

  @override
  ConsumerState<PickOrdersPage> createState() => _PickOrdersPageState();
}

class _PickOrdersPageState extends ConsumerState<PickOrdersPage> {

  Future<void> _assign(String id) async {
    final users = await ApiService.getList('/accounts/users/');
    if (!mounted) return;
    final user = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: Text(TranslationService.tr('pickOrders.selectPicker')),
        children: users.map<Widget>((u) => SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, u),
          child: Text(u['login'] ?? u['email'] ?? 'User #${u['id']}'),
        )).toList(),
      ),
    );
    if (user != null) {
      await ApiService.patch('/warehouse/pick-orders/$id/', data: {'assigned_to': user['id']});
      ref.invalidate(pickOrdersProvider);
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    await ApiService.patch('/warehouse/pick-orders/$id/', data: {'status': status});
    ref.invalidate(pickOrdersProvider);
  }

  @override
  Widget build(BuildContext context) {
    final orders = ref.watch(pickOrdersProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('pickOrders.title'))),
      body: orders.when(
        loading: () => const ShimmerList(),
        error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
        data: (items) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(pickOrdersProvider),
          child: items.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.receipt_long, size: 64, color: const Color(AppTheme.textSecondary)),
                const SizedBox(height: 12), Text(TranslationService.tr('pickOrders.empty')),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final o = items[index];
                  final status = o['status'] ?? 'pending';
                  final statusColor = status == 'picked' ? Colors.green : status == 'in_progress' ? Colors.orange : status == 'cancelled' ? Colors.red : Colors.grey;
                  String statusLabel(String s) {
                    switch (s) {
                      case 'pending': return TranslationService.tr('pickOrders.statusPending');
                      case 'in_progress': return TranslationService.tr('pickOrders.statusInProgress');
                      case 'picked': return TranslationService.tr('pickOrders.statusPicked');
                      case 'cancelled': return TranslationService.tr('pickOrders.statusCancelled');
                      default: return s;
                    }
                  }
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ExpansionTile(
                      leading: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                        child: Icon(status == 'picked' ? Icons.check_circle : status == 'in_progress' ? Icons.play_circle : Icons.pending, color: statusColor),
                      ),
                      title: Text(o['pick_number'] ?? '#${o['id']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(TranslationService.tr('pickOrders.status').replaceAll('{status}', statusLabel(status)), style: TextStyle(color: statusColor)),
                      trailing: Chip(label: Text(statusLabel(status), style: TextStyle(fontSize: 11, color: statusColor)), backgroundColor: statusColor.withValues(alpha: 0.1)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (o['assigned_to_name'] != null)
                                Text(TranslationService.tr('pickOrders.picker').replaceAll('{name}', '${o['assigned_to_name']}'), style: const TextStyle(fontSize: 13, color: Color(AppTheme.textSecondary))),
                              if (o['items_count'] != null)
                                Text(TranslationService.tr('pickOrders.products').replaceAll('{count}', '${o['items_count']}'), style: const TextStyle(fontSize: 13, color: Color(AppTheme.textSecondary))),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  if (status == 'pending')
                                    Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.person_add, size: 16), label: Text(TranslationService.tr('pickOrders.assign'), style: const TextStyle(fontSize: 12)), onPressed: () => _assign('${o['id']}'))),
                                  if (status == 'pending')
                                    const SizedBox(width: 8),
                                  if (status == 'pending')
                                    Expanded(child: FilledButton.icon(icon: const Icon(Icons.play_arrow, size: 16), label: Text(TranslationService.tr('pickOrders.start'), style: const TextStyle(fontSize: 12)), onPressed: () => _updateStatus('${o['id']}', 'in_progress'))),
                                  if (status == 'in_progress')
                                    Expanded(child: FilledButton.icon(icon: const Icon(Icons.check, size: 16), label: Text(TranslationService.tr('pickOrders.complete'), style: const TextStyle(fontSize: 12)), style: FilledButton.styleFrom(backgroundColor: Colors.green), onPressed: () => _updateStatus('${o['id']}', 'picked'))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
        ),
      ),
    );
  }
}
