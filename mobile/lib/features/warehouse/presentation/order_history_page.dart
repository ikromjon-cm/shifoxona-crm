import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/shimmer_list.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final incomeProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/income/', params: {'limit': 50});
});

final expenseProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/expense/', params: {'limit': 50});
});

class OrderHistoryPage extends ConsumerStatefulWidget {
  const OrderHistoryPage({super.key});

  @override
  ConsumerState<OrderHistoryPage> createState() => _OrderHistoryPageState();
}

class _OrderHistoryPageState extends ConsumerState<OrderHistoryPage> with SingleTickerProviderStateMixin {
  late TabController _tc;

  @override
  void initState() {
    super.initState();
    _tc = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('nav.orderHistory')),
        bottom: TabBar(
          controller: _tc,
          tabs: [
            Tab(text: TranslationService.tr('stock.income')),
            Tab(text: TranslationService.tr('stock.expense')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tc,
        children: [
          _IncomeList(),
          _ExpenseList(),
        ],
      ),
    );
  }
}

class _IncomeList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final income = ref.watch(incomeProvider);
    return income.when(
      loading: () => const ShimmerList(),
      error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
      data: (items) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(incomeProvider),
        child: items.isEmpty
          ? Center(child: Text(TranslationService.tr('orderHistory.noIncome'), style: TextStyle(color: const Color(AppTheme.textSecondary))))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.add_shopping_cart, color: Colors.green),
                    ),
                    title: Text('${TranslationService.tr('income.date')}: ${item['date'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${TranslationService.tr('income.supplier')}: ${item['supplier_name'] ?? '-'}'),
                    trailing: Text('${item['items_count'] ?? 0} ${TranslationService.tr('income.quantity').toLowerCase()}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                  ),
                );
              },
            ),
      ),
    );
  }
}

class _ExpenseList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expense = ref.watch(expenseProvider);
    return expense.when(
      loading: () => const ShimmerList(),
      error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
      data: (items) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(expenseProvider),
        child: items.isEmpty
          ? Center(child: Text(TranslationService.tr('orderHistory.noExpense'), style: TextStyle(color: const Color(AppTheme.textSecondary))))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.remove_shopping_cart, color: Colors.red),
                    ),
                    title: Text('${TranslationService.tr('expense.date')}: ${item['date'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${TranslationService.tr('expense.reason')}: ${item['reason'] ?? '-'}'),
                    trailing: Text('${item['items_count'] ?? 0} ${TranslationService.tr('income.quantity').toLowerCase()}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  ),
                );
              },
            ),
      ),
    );
  }
}
