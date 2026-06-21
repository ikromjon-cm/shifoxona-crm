import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'firebase_options.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'app/app.dart';
import 'core/cache/cache_service.dart';
import 'core/connectivity/api_queue_service.dart';
import 'core/connectivity/connectivity_service.dart';
import 'data/api/api_client.dart';
import 'core/router/navigator_key.dart';
import 'features/i18n/services/translation_service.dart';
import 'features/notifications/services/fcm_service.dart';
import 'features/notifications/services/notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await CacheService.init();
  await ApiClient.init();
  await ApiQueueService.loadQueue();
  const typeRouteMap = {
    'low_stock': '/stock-reports',
    'expiry': '/stock-reports',
    'income': '/income',
    'expense': '/expense',
    'medicine': '/medicines',
    'system': '/notifications',
  };

  await NotificationService.init(
    onTap: (payload) {
      if (payload == null || rootNavigatorKey.currentContext == null) return;
      try {
        String route;
        if (payload.startsWith('/')) {
          route = payload;
        } else {
          final data = jsonDecode(payload) as Map<String, dynamic>;
          route = (data['link'] as String?) ?? typeRouteMap[data['type']] ?? '/notifications';
        }
        GoRouter.of(rootNavigatorKey.currentContext!).go(route);
      } catch (_) {}
    },
  );
  await TranslationService.load('uz');

  final sentryDsn = const String.fromEnvironment('SENTRY_DSN', defaultValue: '');

  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
        options.tracesSampleRate = 0.2;
      },
      appRunner: () => runApp(const ProviderScope(child: _ShifoxonaApp())),
    );
  } else {
    runApp(const ProviderScope(child: _ShifoxonaApp()));
  }
}

class _ShifoxonaApp extends ConsumerStatefulWidget {
  const _ShifoxonaApp();

  @override
  ConsumerState<_ShifoxonaApp> createState() => _ShifoxonaAppState();
}

class _ShifoxonaAppState extends ConsumerState<_ShifoxonaApp> {
  @override
  void initState() {
    super.initState();
    _initServices();
  }

  Future<void> _initServices() async {
    await FcmService.init(ref);
    ref.listen(connectivityProvider, (prev, online) {
      if (online.valueOrNull == true) {
        ApiQueueService.processQueue();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const ShifoxonaApp();
  }
}
