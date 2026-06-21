import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final zonesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/zones/');
});

final binsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/bins/');
});

class BinsPage extends ConsumerStatefulWidget {
  const BinsPage({super.key});

  @override
  ConsumerState<BinsPage> createState() => _BinsPageState();
}

class _BinsPageState extends ConsumerState<BinsPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('nav.stockBins')),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(icon: const Icon(Icons.map), text: TranslationService.tr('bins.zones')),
            Tab(icon: const Icon(Icons.inventory_2), text: TranslationService.tr('bins.bins')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ZonesTab(),
          _BinsTab(),
        ],
      ),
    );
  }
}

class _ZonesTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final zones = ref.watch(zonesProvider);
    return zones.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
      data: (items) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(zonesProvider),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final z = items[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: const Color(AppTheme.primaryColor).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.map, color: Color(AppTheme.primaryColor)),
                ),
                title: Text(z['name'] ?? ''),
                subtitle: Text(z['code'] ?? ''),
                trailing: Text('${z['bin_count'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _BinsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bins = ref.watch(binsProvider);
    return bins.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
      data: (items) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(binsProvider),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final b = items[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: const Color(AppTheme.success).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.inventory_2, color: Color(AppTheme.success)),
                ),
                title: Text(b['code'] ?? ''),
                subtitle: Text('${b['zone_name'] ?? ''} • ${b['shelf'] ?? ''}'),
                trailing: Text('${b['item_count'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            );
          },
        ),
      ),
    );
  }
}
