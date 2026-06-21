import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/api/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../i18n/services/translation_service.dart';
import '../../../data/providers/auth_provider.dart';

final dashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ApiService.get('/accounts/dashboard/');
});

// ── Role-specific stat configs ────────────────────────────────
const _statConfigs = {
  'superadmin': {'medicines', 'orders', 'tasks', 'users'},
  'admin': {'medicines', 'orders', 'tasks', 'users'},
  'warehouse': {'medicines', 'orders', 'tasks', 'stock'},
  'pharmacy': {'medicines', 'orders', 'tasks', 'pharmacy'},
  'driver': {'deliveries', 'orders', 'tasks', 'pharmacy'},
  'finance': {'orders', 'expenses', 'tasks', 'stock'},
  'operator': {'medicines', 'orders', 'tasks', 'deliveries'},
};

const _statMeta = {
  'medicines': StatMeta(Icons.medication_outlined, 'Dori vositalari', AppColors.gradientInfo),
  'orders': StatMeta(Icons.receipt_long_outlined, 'Buyurtmalar', AppColors.gradientPrimary),
  'tasks': StatMeta(Icons.task_alt_outlined, 'Vazifalar', AppColors.gradientWarning),
  'users': StatMeta(Icons.people_outlined, 'Foydalanuvchilar', AppColors.gradientAccent),
  'stock': StatMeta(Icons.inventory_2_outlined, 'Ombor', AppColors.gradientSuccess),
  'deliveries': StatMeta(Icons.local_shipping_outlined, 'Yetkazish', AppColors.gradientPrimary),
  'pharmacy': StatMeta(Icons.local_pharmacy_outlined, 'Dorixona', AppColors.gradientAccent),
  'expenses': StatMeta(Icons.money_off_outlined, 'Xarajatlar', AppColors.gradientDanger),
};

class StatMeta {
  final IconData icon;
  final String label;
  final LinearGradient gradient;
  const StatMeta(this.icon, this.label, this.gradient);
}

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  static const _chipPermissions = {
    '/stock-reports': ['superadmin', 'admin', 'warehouse'],
    '/order-history': ['superadmin', 'admin', 'operator', 'pharmacy'],
    '/scan': ['superadmin', 'admin', 'warehouse'],
    '/income': ['superadmin', 'admin', 'warehouse'],
    '/expense': ['superadmin', 'admin', 'warehouse'],
    '/delivery': ['superadmin', 'admin', 'operator', 'driver', 'pharmacy'],
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardStatsProvider);
    final role = ref.watch(authProvider.select((s) => s.role));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('dashboard.title')),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isDark
                  ? [const Color(0xFF1E3A5F), AppColors.cardDark]
                  : [AppColors.primary.withValues(alpha: 0.05), AppColors.surface],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ),
      body: stats.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: AppShimmerList(itemCount: 6, itemHeight: 100),
        ),
        error: (e, _) => AppEmptyState(
          icon: Icons.cloud_off_outlined,
          title: TranslationService.tr('common.error'),
          subtitle: '${e.toString().substring(0, e.toString().length.clamp(0, 80))}',
          onRetry: () => ref.invalidate(dashboardStatsProvider),
        ),
        data: (data) {
          final statIds = _statConfigs[role] ?? _statConfigs['operator']!;
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(dashboardStatsProvider),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
              children: [
                // ── Welcome Section ──
                _buildWelcome(context, ref),
                const SizedBox(height: 20),

                // ── Stats Grid ──
                GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 1.4,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: statIds.length,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemBuilder: (_, i) {
                    final id = statIds.elementAt(i);
                    final meta = _statMeta[id]!;
                    final value = '${data[id] ?? 0}';
                    return StatCard(
                      label: meta.label,
                      value: value,
                      icon: meta.icon,
                      color: meta.gradient.colors.first,
                      gradient: meta.gradient,
                    );
                  },
                ),

                // ── Quick Actions ──
                if (role != null) ...[
                  const SizedBox(height: 24),
                  SectionHeader(title: TranslationService.tr('dashboard.recentActivities')),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 10, runSpacing: 10,
                    children: [
                      if (_canAccess(role, '/scan'))
                        AppActionChip(icon: Icons.qr_code_scanner_outlined, label: TranslationService.tr('nav.scanner'), color: AppColors.primary, onTap: () => Navigator.pushNamed(context, '/scan')),
                      if (_canAccess(role, '/income'))
                        AppActionChip(icon: Icons.add_shopping_cart_outlined, label: TranslationService.tr('nav.stockIncome'), color: AppColors.success, onTap: () => Navigator.pushNamed(context, '/income')),
                      if (_canAccess(role, '/expense'))
                        AppActionChip(icon: Icons.remove_shopping_cart_outlined, label: TranslationService.tr('nav.stockExpense'), color: AppColors.danger, onTap: () => Navigator.pushNamed(context, '/expense')),
                      if (_canAccess(role, '/delivery'))
                        AppActionChip(icon: Icons.local_shipping_outlined, label: TranslationService.tr('nav.delivery'), color: AppColors.secondary, onTap: () => Navigator.pushNamed(context, '/delivery')),
                      if (_canAccess(role, '/stock-reports'))
                        AppActionChip(icon: Icons.assessment_outlined, label: TranslationService.tr('nav.stockReports'), color: AppColors.info, onTap: () => Navigator.pushNamed(context, '/stock-reports')),
                      if (_canAccess(role, '/order-history'))
                        AppActionChip(icon: Icons.history_outlined, label: TranslationService.tr('nav.orderHistory'), color: AppColors.warning, onTap: () => Navigator.pushNamed(context, '/order-history')),
                    ],
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildWelcome(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final userName = auth.user?['first_name'] != null
        ? '${auth.user!['first_name']} ${auth.user!['last_name'] ?? ''}'.trim()
        : (auth.user?['login'] ?? 'Foydalanuvchi');
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.gradientPrimary,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Assalomu alaykum,',
            style: GoogleFonts.poppins(fontSize: 14, color: Colors.white.withValues(alpha: 0.8)),
          ),
          const SizedBox(height: 4),
          Text(userName,
            style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.wb_sunny_outlined, size: 14, color: Colors.white.withValues(alpha: 0.9)),
                const SizedBox(width: 6),
                Text('Xush kelibsiz!',
                  style: GoogleFonts.poppins(fontSize: 12, color: Colors.white.withValues(alpha: 0.9)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _canAccess(String? role, String route) {
    if (role == null) return false;
    final allowed = _chipPermissions[route];
    return allowed?.contains(role) ?? true;
  }
}
