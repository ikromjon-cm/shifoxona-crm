import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_theme.dart';

// ── Gradient AppBar ──────────────────────────────────────────
class GradientAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final Gradient? gradient;
  final bool centerTitle;

  const GradientAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.gradient,
    this.centerTitle = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: gradient ?? AppColors.gradientPrimary,
      ),
      child: AppBar(
        centerTitle: centerTitle,
        title: Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
        actions: actions,
        leading: leading,
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// ── Gradient Card ─────────────────────────────────────────────
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final Color? color;
  final List<BoxShadow>? boxShadow;

  const AppCard({
    super.key,
    required this.child,
    this.margin,
    this.padding,
    this.onTap,
    this.gradient,
    this.color,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        gradient: gradient,
        color: gradient == null ? (color ?? Theme.of(context).cardTheme.color) : null,
        borderRadius: BorderRadius.circular(16),
        boxShadow: boxShadow ??
            [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: padding ?? const EdgeInsets.all(16),
            child: child,
          ),
        ),
      ),
    );
  }
}

// ── Stat Card (for dashboards) ────────────────────────────────
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.gradient,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: this.gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 24),
                ),
                const SizedBox(height: 16),
                Text(value,
                  style: GoogleFonts.poppins(
                    fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white,
                    shadows: [Shadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4)],
                  ),
                ),
                Text(label,
                  style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.85)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Action Chip ───────────────────────────────────────────────
class AppActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const AppActionChip({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(label,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Status Badge ──────────────────────────────────────────────
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const StatusBadge({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label,
        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

// ── Empty State ───────────────────────────────────────────────
class AppEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;

  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.textTertiary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: AppColors.textTertiary),
            ),
            const SizedBox(height: 20),
            Text(title,
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!,
                style: GoogleFonts.poppins(fontSize: 14, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              FilledButton.tonalIcon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: Text('Qayta yuklash'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────
class SectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTrailingTap;

  const SectionHeader({super.key, required this.title, this.trailing, this.onTrailingTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          if (trailing != null)
            GestureDetector(
              onTap: onTrailingTap,
              child: Text(trailing!,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.primary),
              ),
            ),
        ],
      ),
    );
  }
}

// ── List Item with icon and status ────────────────────────────
class AppListItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? trailing;
  final Color? iconColor;
  final Widget? trailingWidget;
  final VoidCallback? onTap;
  final Color? statusColor;
  final String? statusLabel;

  const AppListItem({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.iconColor,
    this.trailingWidget,
    this.onTap,
    this.statusColor,
    this.statusLabel,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (iconColor ?? AppColors.primary).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor ?? AppColors.primary, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(subtitle!,
                      style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textSecondary),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ),
          if (statusLabel != null)
            StatusBadge(label: statusLabel!, color: statusColor ?? AppColors.primary),
          if (trailing != null)
            Text(trailing!,
              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
            ),
          if (trailingWidget != null) trailingWidget!,
          if (onTap != null) const SizedBox(width: 4),
          if (onTap != null) const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 20),
        ],
      ),
    );
  }
}

// ── Shimmer Loading ────────────────────────────────────────────
class AppShimmerList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;

  const AppShimmerList({super.key, this.itemCount = 5, this.itemHeight = 76});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.white12 : Colors.grey[300]!,
      highlightColor: isDark ? Colors.white24 : Colors.grey[100]!,
      child: Column(
        children: List.generate(itemCount, (i) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Container(
            height: itemHeight,
            decoration: BoxDecoration(
              color: isDark ? Colors.white12 : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        )),
      ),
    );
  }
}

// ── Page Container ─────────────────────────────────────────────
class PageContainer extends StatelessWidget {
  final Widget child;
  final bool withScrolling;

  const PageContainer({super.key, required this.child, this.withScrolling = true});

  @override
  Widget build(BuildContext context) {
    if (withScrolling) {
      return SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 80),
        child: child,
      );
    }
    return child;
  }
}
