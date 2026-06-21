import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';
import '../../../data/api/api_service.dart';

class NotificationPreferencesPage extends ConsumerStatefulWidget {
  const NotificationPreferencesPage({super.key});

  @override
  ConsumerState<NotificationPreferencesPage> createState() => _NotificationPreferencesPageState();
}

class _NotificationPreferencesPageState extends ConsumerState<NotificationPreferencesPage> {
  Map<String, dynamic> _settings = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final data = await ApiService.get('/notifications/settings/');
      if (mounted) setState(() => _settings = data);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _toggle(String key) async {
    final newValue = !(_settings[key] ?? true);
    setState(() => _settings[key] = newValue);
    try {
      await ApiService.patch('/notifications/settings/', data: {key: newValue});
    } catch (_) {
      setState(() => _settings[key] = !newValue);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text(TranslationService.tr('settings.notifications')), backgroundColor: Colors.white),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _switchTile('low_stock', TranslationService.tr('settings.lowStock'), TranslationService.tr('settings.lowStockDesc')),
              _switchTile('expiry', TranslationService.tr('settings.expiry'), TranslationService.tr('settings.expiryDesc')),
              _switchTile('income', TranslationService.tr('settings.income'), TranslationService.tr('settings.incomeDesc')),
              _switchTile('expense', TranslationService.tr('settings.expense'), TranslationService.tr('settings.expenseDesc')),
              _switchTile('push', TranslationService.tr('settings.push'), TranslationService.tr('settings.pushDesc')),
            ],
          ),
    );
  }

  Widget _switchTile(String key, String title, String subtitle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: SwitchListTile(
        title: Text(title, style: const TextStyle(fontSize: 16)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(AppTheme.textSecondary))),
        value: _settings[key] ?? true,
        onChanged: (_) => _toggle(key),
        activeThumbColor: const Color(AppTheme.primaryColor),
      ),
    );
  }
}
