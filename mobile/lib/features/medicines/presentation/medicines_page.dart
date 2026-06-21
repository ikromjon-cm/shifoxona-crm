import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/api/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../i18n/services/translation_service.dart';

final medicinesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/medicines/medicines/');
});

class MedicinesPage extends ConsumerStatefulWidget {
  const MedicinesPage({super.key});

  @override
  ConsumerState<MedicinesPage> createState() => _MedicinesPageState();
}

class _MedicinesPageState extends ConsumerState<MedicinesPage> {
  final _searchCtrl = TextEditingController();
  List<dynamic>? _filtered;
  List<dynamic>? _allItems;

  void _search(String q) {
    if (q.isEmpty) {
      setState(() => _filtered = null);
      return;
    }
    final query = q.toLowerCase();
    setState(() {
      _filtered = _allItems?.where((m) =>
        (m['name']?.toString().toLowerCase().contains(query) ?? false) ||
        (m['barcode']?.toString().contains(query) ?? false)
      ).toList();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final medicines = ref.watch(medicinesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('medicine.list'))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: TranslationService.tr('medicine.search'),
                prefixIcon: Padding(
                  padding: const EdgeInsets.all(12),
                  child: ShaderMask(
                    shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                    child: const Icon(Icons.search, color: Colors.white),
                  ),
                ),
                suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear, color: AppColors.textSecondary), onPressed: () { _searchCtrl.clear(); _search(''); })
                  : null,
              ),
              onChanged: _search,
            ),
          ),
          Expanded(
            child: medicines.when(
              loading: () => const AppShimmerList(),
              error: (e, _) => AppEmptyState(
                icon: Icons.cloud_off_outlined,
                title: TranslationService.tr('common.error'),
                onRetry: () => ref.invalidate(medicinesProvider),
              ),
              data: (items) {
                _allItems = items;
                final display = _filtered ?? items;
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(medicinesProvider),
                  child: display.isEmpty
                    ? SingleChildScrollView(
                        child: AppEmptyState(
                          icon: Icons.medication_outlined,
                          title: TranslationService.tr('common.noData'),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: display.length,
                        itemBuilder: (context, index) {
                          final item = display[index];
                          final qty = item['quantity'] ?? 0;
                          final price = item['selling_price'] ?? item['price'] ?? 0;
                          final isLow = qty is int && qty < 10;
                          return AppListItem(
                            icon: Icons.medication_outlined,
                            iconColor: isLow ? AppColors.danger : AppColors.primary,
                            title: item['name'] ?? '',
                            subtitle: 'Barcode: ${item['barcode'] ?? '-'}',
                            trailingWidget: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('$qty dona',
                                  style: GoogleFonts.poppins(
                                    fontSize: 15, fontWeight: FontWeight.w700,
                                    color: isLow ? AppColors.danger : AppColors.textPrimary,
                                  ),
                                ),
                                Text('$price so\'m',
                                  style: GoogleFonts.poppins(fontSize: 11, color: AppColors.textSecondary),
                                ),
                                if (isLow)
                                  const StatusBadge(label: 'Kam', color: AppColors.danger),
                              ],
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
