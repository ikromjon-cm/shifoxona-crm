import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../i18n/services/translation_service.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final locale = ref.watch(localeProvider);
    final userName = auth.user?['first_name'] != null
        ? '${auth.user!['first_name']} ${auth.user!['last_name'] ?? ''}'.trim()
        : (auth.user?['login'] ?? 'Foydalanuvchi');
    final roleName = auth.role != null
        ? TranslationService.tr('user.role.${auth.role}')
        : '';

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('profile.title'))),
      body: PageContainer(
        child: Column(
          children: [
            const SizedBox(height: 20),
            // ── Avatar section ──
            Center(
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.gradientPrimary,
                    ),
                    child: const CircleAvatar(
                      radius: 42,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, color: AppColors.primary, size: 44),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(userName,
                    style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(roleName,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // ── Settings card ──
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    secondary: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(isDark ? Icons.dark_mode : Icons.light_mode,
                        color: AppColors.warning, size: 20),
                    ),
                    title: Text('Qorong\'i rejim',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500),
                    ),
                    value: isDark,
                    onChanged: (_) => ref.read(themeProvider.notifier).toggle(),
                    activeColor: AppColors.primary,
                  ),
                  Divider(height: 1, indent: 16, endIndent: 16),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.info.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.language, color: AppColors.info, size: 20),
                    ),
                    title: Text(TranslationService.tr('profile.language'),
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500),
                    ),
                    subtitle: Text(_localeLabel(locale),
                      style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary),
                    onTap: () => _showLangPicker(context, ref, locale),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── App info card ──
            AppCard(
              padding: EdgeInsets.zero,
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.info_outline, color: AppColors.primary, size: 20),
                ),
                title: Text('Shifoxona CRM',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500),
                ),
                subtitle: Text('Versiya 1.0.0',
                  style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textSecondary),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // ── Logout ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity, height: 52,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.logout, color: AppColors.danger),
                  label: Text(TranslationService.tr('login.logout'),
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.danger)),
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                  },
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppColors.danger.withValues(alpha: 0.3)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _localeLabel(String code) {
    switch (code) {
      case 'uz': return 'O\'zbekcha';
      case 'ru': return 'Русский';
      case 'en': return 'English';
      default: return code;
    }
  }

  void _showLangPicker(BuildContext context, WidgetRef ref, String current) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(TranslationService.tr('profile.language'),
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _langTile(ctx, ref, 'uz', 'O\'zbekcha', current),
            _langTile(ctx, ref, 'ru', 'Русский', current),
            _langTile(ctx, ref, 'en', 'English', current),
          ],
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  Widget _langTile(BuildContext ctx, WidgetRef ref, String code, String label, String current) {
    final selected = code == current;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: selected ? AppColors.primary.withValues(alpha: 0.08) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            ref.read(localeProvider.notifier).setLocale(code);
            Navigator.pop(ctx);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text(label,
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: selected ? FontWeight.w600 : FontWeight.w400),
                ),
                const Spacer(),
                if (selected)
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: Colors.white, size: 14),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
