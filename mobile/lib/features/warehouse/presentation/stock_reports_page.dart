import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/api/api_service.dart';
import '../../../widgets/shimmer_list.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final stockReportProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ApiService.get('/warehouse/stocks/report/');
});

final lowStockProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/medicines/medicines/', params: {'low_stock': 'true'});
});

class StockReportsPage extends ConsumerWidget {
  const StockReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final report = ref.watch(stockReportProvider);
    final lowStock = ref.watch(lowStockProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('nav.stockReports'))),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(stockReportProvider);
          ref.invalidate(lowStockProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            report.when(
              loading: () => const ShimmerGrid(count: 2),
              error: (e, _) => Text('${TranslationService.tr('common.error')}: $e'),
              data: (data) => GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _MiniStatCard(title: TranslationService.tr('dashboard.totalMedicines'), value: '${data['total_medicines'] ?? 0}', icon: Icons.medication, color: const Color(AppTheme.primaryColor)),
                  _MiniStatCard(title: TranslationService.tr('stockReports.lowStock'), value: '${data['low_stock_count'] ?? 0}', icon: Icons.warning_amber, color: Colors.orange),
                  _MiniStatCard(title: TranslationService.tr('dashboard.expiringSoon'), value: '${data['expiring_soon'] ?? 0}', icon: Icons.event, color: Colors.red),
                  _MiniStatCard(title: TranslationService.tr('stockReports.totalValue'), value: '${data['total_value'] ?? 0}', icon: Icons.attach_money, color: Colors.green),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(TranslationService.tr('stockReports.lowStockMedicines'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            lowStock.when(
              loading: () => const ShimmerList(itemCount: 3),
              error: (e, _) => Text('${TranslationService.tr('common.error')}: $e'),
              data: (items) => items.isEmpty
                ? Card(child: Padding(padding: const EdgeInsets.all(24), child: Center(child: Text(TranslationService.tr('stockReports.allSufficient')))))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final m = items[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.warning_amber, color: Colors.orange),
                          ),
                          title: Text(m['name'] ?? ''),
                          subtitle: Text(TranslationService.tr('stockReports.remaining').replaceAll('{count}', '${m['quantity'] ?? 0}')),
                          trailing: Text('${m['quantity'] ?? 0}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.orange)),
                        ),
                      );
                    },
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final Color color;

  const _MiniStatCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 18),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text(title, style: const TextStyle(fontSize: 11, color: Color(AppTheme.textSecondary))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
