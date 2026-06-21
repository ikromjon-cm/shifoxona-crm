import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/config/role_config.dart';
import '../data/providers/auth_provider.dart';
import '../features/notifications/services/notification_service.dart';
import '../core/theme/app_theme.dart';
import '../features/i18n/services/translation_service.dart';

class AppShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;
  const AppShell({super.key, required this.navigationShell});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  bool _pollingStarted = false;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (!_pollingStarted && auth.user != null) {
      _pollingStarted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        NotificationService.startPolling(ref);
      });
    }

    final tabs = getTabsForRole(auth.role);
    final selectedBranch = widget.navigationShell.currentIndex;
    final currentTabIndex = _findCurrentTabIndex(tabs, selectedBranch);

    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: NavigationBar(
              selectedIndex: currentTabIndex,
              onDestinationSelected: (i) {
                final tab = tabs[i];
                if (tab.action == TabAction.branch) {
                  widget.navigationShell.goBranch(tab.branchIndex!,
                      initialLocation: i == currentTabIndex);
                } else {
                  context.push(tab.pushRoute!);
                }
              },
              backgroundColor: Colors.transparent,
              elevation: 0,
              shadowColor: Colors.transparent,
              height: 60,
              destinations: tabs.map((t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: _buildGradientIcon(t.activeIcon),
                label: TranslationService.tr(t.labelKey),
              )).toList(),
            ),
          ),
        ),
      ),
      drawer: _buildDrawer(context, auth),
    );
  }

  Widget _buildGradientIcon(IconData icon) {
    return ShaderMask(
      shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
      child: Icon(icon, size: 22, color: Colors.white),
    );
  }

  int _findCurrentTabIndex(List<BottomTab> tabs, int branchIndex) {
    for (int i = 0; i < tabs.length; i++) {
      if (tabs[i].branchIndex == branchIndex) return i;
    }
    return 0;
  }

  Widget _buildDrawer(BuildContext context, AuthState auth) {
    final drawerItems = getDrawerItemsForRole(auth.role);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final userName = auth.user?['first_name'] != null
        ? '${auth.user!['first_name']} ${auth.user!['last_name'] ?? ''}'.trim()
        : (auth.user?['login'] ?? 'Foydalanuvchi');
    final roleName = auth.role != null
        ? TranslationService.tr('user.role.${auth.role}')
        : '';

    return Drawer(
      backgroundColor: isDark ? AppColors.cardDark : Colors.white,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: AppColors.gradientPrimary,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        child: Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                          style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(userName,
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(roleName,
                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: drawerItems.length,
              itemBuilder: (context, i) {
                final item = drawerItems[i];
                final isSelected = item.branchIndex != null && item.branchIndex == widget.navigationShell.currentIndex;
                return _drawerItem(item.icon, TranslationService.tr(item.labelKey), isSelected, () {
                  Navigator.pop(context);
                  if (item.branchIndex != null) {
                    widget.navigationShell.goBranch(item.branchIndex!);
                  } else if (item.pushRoute != null) {
                    context.push(item.pushRoute!);
                  }
                });
              },
            ),
          ),
          // Bottom version
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.06))),
            ),
            child: Text('Shifoxona CRM v1.0',
              style: GoogleFonts.poppins(fontSize: 11, color: AppColors.textTertiary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: selected ? AppColors.primary.withValues(alpha: 0.08) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                ShaderMask(
                  shaderCallback: (bounds) => selected
                      ? AppColors.gradientPrimary.createShader(bounds)
                      : const LinearGradient(colors: [AppColors.textSecondary, AppColors.textSecondary]).createShader(bounds),
                  child: Icon(icon, size: 22, color: Colors.white),
                ),
                const SizedBox(width: 14),
                Text(label,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    color: selected ? AppColors.primary : AppColors.textPrimary,
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
