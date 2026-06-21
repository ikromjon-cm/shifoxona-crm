import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/loading_overlay.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final pickOrdersProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/warehouse/pick-orders/', params: {'status': 'pending,assigned,in_progress'});
});

class ExpensePage extends ConsumerStatefulWidget {
  const ExpensePage({super.key});

  @override
  ConsumerState<ExpensePage> createState() => _ExpensePageState();
}

class _ExpensePageState extends ConsumerState<ExpensePage> {
  final _barcodeCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final List<Map<String, dynamic>> _items = [];
  bool _loading = false;
  String? _selectedOrder;

  @override
  void dispose() {
    _barcodeCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  Future<void> _addByBarcode() async {
    final barcode = _barcodeCtrl.text.trim();
    if (barcode.isEmpty) return;
    try {
      final data = await ApiService.get('/medicines/medicines/by_barcode/', params: {'barcode': barcode});
      final existingIdx = _items.indexWhere((i) => i['barcode'] == barcode);
      setState(() {
        if (existingIdx >= 0) {
          _items[existingIdx]['quantity'] = (_items[existingIdx]['quantity'] as int) + 1;
        } else {
          _items.add({
            'name': data['name'] ?? 'Noma\'lum',
            'barcode': barcode,
            'quantity': 1,
            'price': data['price'] ?? 0,
          });
        }
        _barcodeCtrl.clear();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('income.productNotFound')), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _scanBarcode() async {
    final result = await Navigator.pushNamed(context, '/scan');
    if (result != null && result is String) {
      _barcodeCtrl.text = result;
      _addByBarcode();
    }
  }

  Future<void> _submit() async {
    if (_items.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ApiService.post('/warehouse/expense/', data: {
        'pick_order_id': _selectedOrder,
        'items': _items.map((i) => {
          'barcode': i['barcode'],
          'quantity': i['quantity'],
        }).toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('expense.created')), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${TranslationService.tr('common.error')}: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orders = ref.watch(pickOrdersProvider);

    return LoadingOverlay(
      isLoading: _loading,
      child: Scaffold(
        appBar: AppBar(title: Text(TranslationService.tr('nav.stockExpense')), actions: [
          TextButton(onPressed: _submit, child: Text(TranslationService.tr('stock.expenseAdd'), style: const TextStyle(fontWeight: FontWeight.bold))),
        ]),
        body: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
          data: (orderList) => SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: DropdownButtonFormField<String>(
                      initialValue: _selectedOrder,
                      decoration: InputDecoration(labelText: TranslationService.tr('expense.pickOrderOptional'), prefixIcon: const Icon(Icons.receipt)),
                      items: orderList.map<DropdownMenuItem<String>>((o) => DropdownMenuItem(value: '${o['id']}', child: Text('${o['order_number'] ?? o['id']}'))).toList(),
                      onChanged: (v) => setState(() => _selectedOrder = v),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(TranslationService.tr('expense.scanProducts'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _barcodeCtrl,
                                decoration: InputDecoration(labelText: TranslationService.tr('income.barcode'), prefixIcon: const Icon(Icons.qr_code), isDense: true),
                                onFieldSubmitted: (_) => _addByBarcode(),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.qr_code_scanner, color: Color(AppTheme.primaryColor)),
                              onPressed: _scanBarcode,
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_circle, color: Color(AppTheme.primaryColor)),
                              onPressed: _addByBarcode,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (_items.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(48),
                      child: Center(child: Text(TranslationService.tr('expense.scannerHint'), style: TextStyle(color: const Color(AppTheme.textSecondary)))),
                    ),
                  )
                else
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${TranslationService.tr('income.products')}: ${_items.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          const Divider(),
                          ..._items.asMap().entries.map((entry) {
                            final i = entry.key;
                            final item = entry.value;
                            return ListTile(
                              leading: Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  color: Colors.red.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.inventory, color: Colors.red, size: 20),
                              ),
                              title: Text(item['name'] ?? ''),
                              subtitle: Text('${TranslationService.tr('income.quantity')}: ${item['quantity']}'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    onPressed: () {
                                      setState(() {
                                        if (item['quantity'] > 1) {
                                          item['quantity'] = item['quantity'] - 1;
                                        } else {
                                          _items.removeAt(i);
                                        }
                                      });
                                    },
                                  ),
                                  Text('${item['quantity']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, size: 20),
                                    onPressed: () => setState(() => item['quantity'] = (item['quantity'] as int) + 1),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
