import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/api/api_service.dart';
import '../../../widgets/shimmer_list.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final tasksProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/tasks/tasks/');
});

class TasksPage extends ConsumerStatefulWidget {
  const TasksPage({super.key});

  @override
  ConsumerState<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends ConsumerState<TasksPage> {
  final _searchCtrl = TextEditingController();
  List<dynamic>? _filtered;
  List<dynamic>? _allItems;

  void _search(String q) {
    if (q.isEmpty) { setState(() => _filtered = null); return; }
    final query = q.toLowerCase();
    setState(() {
      _filtered = _allItems?.where((t) =>
        (t['title']?.toString().toLowerCase().contains(query) ?? false) ||
        (t['description']?.toString().toLowerCase().contains(query) ?? false) ||
        (t['status']?.toString().toLowerCase().contains(query) ?? false)
      ).toList();
    });
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'pending': return TranslationService.tr('task.pending');
      case 'in_progress': return TranslationService.tr('task.inProgress');
      case 'completed': return TranslationService.tr('task.done');
      case 'cancelled': return TranslationService.tr('task.cancelled');
      default: return status ?? '';
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(tasksProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('task.list'))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: TranslationService.tr('task.search'),
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _searchCtrl.clear(); _search(''); })
                  : null,
              ),
              onChanged: _search,
            ),
          ),
          Expanded(
            child: tasks.when(
              loading: () => const ShimmerList(),
              error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
              data: (items) {
                _allItems = items;
                final display = _filtered ?? items;
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(tasksProvider),
                  child: display.isEmpty
                    ? SingleChildScrollView(child: Center(child: Padding(
                        padding: const EdgeInsets.all(48),
                        child: Text(TranslationService.tr('common.noData'), style: const TextStyle(color: Color(AppTheme.textSecondary))),
                      )))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: display.length,
                        itemBuilder: (context, index) {
                          final t = display[index];
                          final status = t['status'] ?? '';
                          final statusColor = status == 'completed' ? Colors.green : status == 'in_progress' ? Colors.orange : Colors.grey;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                                child: Icon(Icons.task_alt, color: statusColor),
                              ),
                              title: Text(t['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w500)),
                              subtitle: Text(t['description'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                              trailing: Chip(label: Text(_statusLabel(status), style: TextStyle(fontSize: 11, color: statusColor)), backgroundColor: statusColor.withValues(alpha: 0.1)),
                            ),
                          );
                        },
                      ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
