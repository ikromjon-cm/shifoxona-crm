import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/shimmer_list.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final movementsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/movements/');
});

class InventoryMovementsPage extends ConsumerWidget {
  const InventoryMovementsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movements = ref.watch(movementsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('movements.title'))),
      body: movements.when(
        loading: () => const ShimmerList(),
        error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
        data: (items) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(movementsProvider),
          child: items.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.swap_vert, size: 64, color: const Color(AppTheme.textSecondary)),
                const SizedBox(height: 12), Text(TranslationService.tr('movements.empty')),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final m = items[index];
                  final isIncome = m['movement_type'] == 'income';
                  final color = isIncome ? Colors.green : Colors.red;
                  final icon = isIncome ? Icons.add_circle : Icons.remove_circle;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                        child: Icon(icon, color: color),
                      ),
                      title: Text(m['medicine_name'] ?? '${TranslationService.tr('income.products')} #${m['medicine']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('${isIncome ? TranslationService.tr('stock.income') : TranslationService.tr('stock.expense')} | ${m['created_at']?.toString().substring(0, 10) ?? ""}'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${isIncome ? "+" : "-"}${m['quantity'] ?? 0}', style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
                          Text('${m['quantity_before'] ?? 0} → ${m['quantity_after'] ?? 0}', style: const TextStyle(fontSize: 11, color: Color(AppTheme.textSecondary))),
                        ],
                      ),
                    ),
                  );
                },
              ),
        ),
      ),
    );
  }
}
