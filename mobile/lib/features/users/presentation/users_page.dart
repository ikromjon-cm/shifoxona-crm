import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/api/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../i18n/services/translation_service.dart';

final usersProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/accounts/users/');
});

class UsersPage extends ConsumerWidget {
  const UsersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('nav.users')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: TranslationService.tr('user.create'),
            onPressed: () => _showCreateDialog(context, ref),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: users.when(
        loading: () => const AppShimmerList(),
        error: (e, _) => AppEmptyState(
          icon: Icons.people_outline,
          title: TranslationService.tr('common.error'),
          onRetry: () => ref.invalidate(usersProvider),
        ),
        data: (items) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(usersProvider),
          child: items.isEmpty
            ? SingleChildScrollView(
                child: AppEmptyState(
                  icon: Icons.person_add_disabled,
                  title: TranslationService.tr('common.noData'),
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final u = items[index];
                  final isBlocked = u['is_blocked'] == true;
                  final login = u['login'] ?? '';
                  final role = u['role'] as String?;
                  final roleLabel = _roleLabel(role);
                  final name = u['first_name'] != null && u['first_name'].toString().isNotEmpty
                      ? '${u['first_name']} ${u['last_name'] ?? ''}'.trim()
                      : null;

                  return AppCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 48, height: 48,
                          decoration: BoxDecoration(
                            gradient: isBlocked
                                ? AppColors.gradientDanger
                                : AppColors.gradientPrimary,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Text(
                              login.isNotEmpty ? login[0].toUpperCase() : '?',
                              style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name ?? login,
                                style: GoogleFonts.poppins(
                                  fontSize: 15, fontWeight: FontWeight.w600,
                                  color: isBlocked ? AppColors.textTertiary : AppColors.textPrimary,
                                  decoration: isBlocked ? TextDecoration.lineThrough : null,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  StatusBadge(label: roleLabel, color: _roleColor(role)),
                                  if (isBlocked)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 8),
                                      child: StatusBadge(label: 'Bloklangan', color: AppColors.danger),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          onSelected: (action) async {
                            try {
                              if (action == 'block') {
                                await ApiService.post('/accounts/users/${u['id']}/block/');
                              } else if (action == 'unblock') {
                                await ApiService.post('/accounts/users/${u['id']}/unblock/');
                              }
                              ref.invalidate(usersProvider);
                            } catch (_) {}
                          },
                          color: Theme.of(context).cardTheme.color,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          itemBuilder: (_) => [
                            if (!isBlocked)
                              PopupMenuItem(
                                value: 'block',
                                child: Row(
                                  children: [
                                    const Icon(Icons.block, color: AppColors.danger, size: 20),
                                    const SizedBox(width: 8),
                                    Text('Bloklash', style: GoogleFonts.poppins(color: AppColors.danger)),
                                  ],
                                ),
                              ),
                            if (isBlocked)
                              PopupMenuItem(
                                value: 'unblock',
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle_outline, color: AppColors.success, size: 20),
                                    const SizedBox(width: 8),
                                    Text('Blokdan chiqarish', style: GoogleFonts.poppins(color: AppColors.success)),
                                  ],
                                ),
                              ),
                          ],
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

String _roleLabel(String? role) {
  switch (role) {
    case 'superadmin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'warehouse': return 'Omborchi';
    case 'pharmacy': return 'Dorixona';
    case 'driver': return 'Haydovchi';
    case 'finance': return 'Moliya';
    case 'operator': return 'Operator';
    default: return role ?? 'Xodim';
  }
}

Color _roleColor(String? role) {
  switch (role) {
    case 'superadmin': return AppColors.danger;
    case 'admin': return AppColors.primary;
    case 'warehouse': return AppColors.success;
    case 'pharmacy': return AppColors.secondary;
    case 'driver': return AppColors.warning;
    case 'finance': return AppColors.info;
    case 'operator': return AppColors.accent;
    default: return AppColors.textSecondary;
  }
}

void _showCreateDialog(BuildContext context, WidgetRef ref) {
  final loginCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  String selectedRole = 'operator';
  bool loading = false;

  showDialog(
    context: context,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (context, setState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(TranslationService.tr('user.create'),
                    style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: loginCtrl,
                    decoration: InputDecoration(
                      labelText: 'Login',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: ShaderMask(
                          shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                          child: const Icon(Icons.person_outline, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: passCtrl,
                    decoration: InputDecoration(
                      labelText: 'Parol',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: ShaderMask(
                          shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                          child: const Icon(Icons.lock_outline, color: Colors.white),
                        ),
                      ),
                    ),
                    obscureText: true,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: firstNameCtrl,
                          decoration: InputDecoration(
                            labelText: 'Ism',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.all(12),
                              child: ShaderMask(
                                shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                                child: const Icon(Icons.badge_outlined, color: Colors.white),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: lastNameCtrl,
                          decoration: InputDecoration(
                            labelText: 'Familiya',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.all(12),
                              child: ShaderMask(
                                shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                                child: const Icon(Icons.badge_outlined, color: Colors.white),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: phoneCtrl,
                    decoration: InputDecoration(
                      labelText: 'Telefon',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: ShaderMask(
                          shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                          child: const Icon(Icons.phone_outlined, color: Colors.white),
                        ),
                      ),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: selectedRole,
                    decoration: InputDecoration(
                      labelText: 'Lavozim',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: ShaderMask(
                          shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                          child: const Icon(Icons.work_outline, color: Colors.white),
                        ),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'admin', child: Text('Admin')),
                      DropdownMenuItem(value: 'warehouse', child: Text('Omborchi')),
                      DropdownMenuItem(value: 'pharmacy', child: Text('Dorixona')),
                      DropdownMenuItem(value: 'driver', child: Text('Haydovchi')),
                      DropdownMenuItem(value: 'finance', child: Text('Moliya')),
                      DropdownMenuItem(value: 'operator', child: Text('Operator')),
                    ],
                    onChanged: (v) { if (v != null) setState(() => selectedRole = v); },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: Text(TranslationService.tr('common.cancel')),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: AppColors.gradientPrimary,
                          ),
                          child: FilledButton(
                            onPressed: loading ? null : () async {
                              if (loginCtrl.text.isEmpty || passCtrl.text.isEmpty) return;
                              setState(() => loading = true);
                              try {
                                await ApiService.post('/accounts/users/create/', data: {
                                  'login': loginCtrl.text,
                                  'password': passCtrl.text,
                                  'first_name': firstNameCtrl.text,
                                  'last_name': lastNameCtrl.text,
                                  'phone': phoneCtrl.text,
                                  'role': selectedRole,
                                });
                                if (ctx.mounted) {
                                  Navigator.pop(ctx);
                                  ref.invalidate(usersProvider);
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                      content: const Text('Foydalanuvchi yaratildi'),
                                      backgroundColor: AppColors.success,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  );
                                }
                              } catch (e) {
                                if (ctx.mounted) {
                                  setState(() => loading = false);
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                      content: Text('Xatolik: $e'),
                                      backgroundColor: AppColors.danger,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  );
                                }
                              }
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                            ),
                            child: loading
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Text(TranslationService.tr('common.save')),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}
