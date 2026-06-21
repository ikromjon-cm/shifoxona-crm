import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/router/app_router.dart';
import '../core/theme/app_theme.dart';
import '../features/i18n/services/translation_service.dart';

class ShifoxonaApp extends ConsumerWidget {
  const ShifoxonaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final router = ref.watch(routerProvider);

    ref.listen(localeProvider, (prev, next) {
      TranslationService.load(next);
    });

    return MaterialApp.router(
      title: TranslationService.tr('app.title'),
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      locale: Locale(locale),
      routerConfig: router,
    );
  }
}
