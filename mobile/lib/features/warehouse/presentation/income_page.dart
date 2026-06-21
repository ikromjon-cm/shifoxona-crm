import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/loading_overlay.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final suppliersProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/medicines/suppliers/');
});

class IncomePage extends ConsumerStatefulWidget {
  const IncomePage({super.key});

  @override
  ConsumerState<IncomePage> createState() => _IncomePageState();
}

class _IncomePageState extends ConsumerState<IncomePage> {
  final _formKey = GlobalKey<FormState>();
  final _noteCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  final _itemNameCtrl = TextEditingController();
  final _itemQtyCtrl = TextEditingController();
  final _itemPriceCtrl = TextEditingController();
  
  String? _selectedSupplier;
  final List<Map<String, dynamic>> _items = [];
  bool _loading = false;
  bool _showAddItem = false;
  DateTime _selectedDate = DateTime.now();

  @override
  void dispose() {
    _noteCtrl.dispose();
    _barcodeCtrl.dispose();
    _itemNameCtrl.dispose();
    _itemQtyCtrl.dispose();
    _itemPriceCtrl.dispose();
    super.dispose();
  }

  Future<void> _scanBarcode() async {
    final result = await Navigator.pushNamed(context, '/scan');
    if (result != null && result is String) {
      _barcodeCtrl.text = result;
      _fetchItemByBarcode(result);
    }
  }

  Future<void> _fetchItemByBarcode(String barcode) async {
    try {
      final data = await ApiService.get('/medicines/medicines/by_barcode/', params: {'barcode': barcode});
      _itemNameCtrl.text = data['name'] ?? '';
      _itemPriceCtrl.text = '${data['price'] ?? '0'}';
    } catch (_) {}
  }

  void _addItem() {
    if (_itemNameCtrl.text.isEmpty || _itemQtyCtrl.text.isEmpty) return;
    setState(() {
      _items.add({
        'name': _itemNameCtrl.text,
        'barcode': _barcodeCtrl.text,
        'quantity': int.tryParse(_itemQtyCtrl.text) ?? 1,
        'price': double.tryParse(_itemPriceCtrl.text) ?? 0,
      });
      _itemNameCtrl.clear();
      _barcodeCtrl.clear();
      _itemQtyCtrl.clear();
      _itemPriceCtrl.clear();
      _showAddItem = false;
    });
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  Future<void> _submit() async {
    if (_selectedSupplier == null || _items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(TranslationService.tr('income.enterSupplierAndProducts'))),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.post('/warehouse/income/', data: {
        'supplier_id': _selectedSupplier,
        'date': _selectedDate.toIso8601String().split('T')[0],
        'note': _noteCtrl.text,
        'items': _items,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('income.created')), backgroundColor: Colors.green),
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
    final suppliers = ref.watch(suppliersProvider);

    return LoadingOverlay(
      isLoading: _loading,
      child: Scaffold(
        appBar: AppBar(
          title: Text(TranslationService.tr('nav.stockIncome')),
          actions: [
            TextButton(onPressed: _submit, child: Text(TranslationService.tr('common.save'), style: const TextStyle(fontWeight: FontWeight.bold))),
          ],
        ),
        body: suppliers.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
          data: (supList) => SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(TranslationService.tr('income.basicInfo'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedSupplier,
                            decoration: InputDecoration(labelText: TranslationService.tr('income.supplier'), prefixIcon: const Icon(Icons.business)),
                            items: supList.map<DropdownMenuItem<String>>((s) => DropdownMenuItem(value: '${s['id']}', child: Text(s['name'] ?? ''))).toList(),
                            onChanged: (v) => setState(() => _selectedSupplier = v),
                            validator: (v) => v == null ? TranslationService.tr('income.selectSupplier') : null,
                          ),
                          const SizedBox(height: 16),
                          InkWell(
                            onTap: () async {
                              final date = await showDatePicker(
                                context: context,
                                initialDate: _selectedDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime.now(),
                              );
                              if (date != null) setState(() => _selectedDate = date);
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(labelText: TranslationService.tr('income.date'), prefixIcon: const Icon(Icons.calendar_today)),
                              child: Text('${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}'),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _noteCtrl,
                            decoration: InputDecoration(labelText: TranslationService.tr('income.note'), prefixIcon: const Icon(Icons.note), alignLabelWithHint: true),
                            maxLines: 3,
                          ),
                        ],
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(TranslationService.tr('income.products'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              TextButton.icon(
                                icon: const Icon(Icons.add, size: 18),
                                label: Text(TranslationService.tr('income.add')),
                                onPressed: () => setState(() => _showAddItem = !_showAddItem),
                              ),
                            ],
                          ),
                          if (_showAddItem) ...[
                            const Divider(),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _barcodeCtrl,
                                    decoration: InputDecoration(labelText: TranslationService.tr('income.barcode'), prefixIcon: const Icon(Icons.qr_code), isDense: true),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.qr_code_scanner, color: Color(AppTheme.primaryColor)),
                                  onPressed: _scanBarcode,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _itemNameCtrl,
                              decoration: InputDecoration(labelText: TranslationService.tr('income.productName'), prefixIcon: const Icon(Icons.medication), isDense: true),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _itemQtyCtrl,
                                    decoration: InputDecoration(labelText: TranslationService.tr('income.quantity'), prefixIcon: const Icon(Icons.numbers), isDense: true),
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _itemPriceCtrl,
                                    decoration: InputDecoration(labelText: TranslationService.tr('income.price'), prefixIcon: const Icon(Icons.attach_money), isDense: true),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton.icon(
                                icon: const Icon(Icons.add),
                                label: Text(TranslationService.tr('income.addProduct')),
                                onPressed: _addItem,
                              ),
                            ),
                          ],
                          if (_items.isEmpty && !_showAddItem)
                            Padding(
                              padding: const EdgeInsets.all(24),
                              child: Center(child: Text(TranslationService.tr('income.noProducts'), style: TextStyle(color: const Color(AppTheme.textSecondary)))),
                            ),
                          ..._items.asMap().entries.map((entry) {
                            final i = entry.key;
                            final item = entry.value;
                            return ListTile(
                              leading: Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  color: const Color(AppTheme.primaryColor).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.medication, color: Color(AppTheme.primaryColor), size: 20),
                              ),
                              title: Text(item['name'] ?? ''),
                              subtitle: Text('${TranslationService.tr('income.quantity')}: ${item['quantity']} | ${TranslationService.tr('income.price')}: ${item['price']} so\'m'),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _removeItem(i),
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
      ),
    );
  }
}
