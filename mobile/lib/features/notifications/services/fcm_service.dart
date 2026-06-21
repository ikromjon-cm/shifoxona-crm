import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/navigator_key.dart';
import '../../../data/api/api_client.dart';
import 'notification_service.dart';

final fcmTokenProvider = StateProvider<String?>((ref) => null);

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> init(WidgetRef ref) async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final token = await _messaging.getToken();
    ref.read(fcmTokenProvider.notifier).state = token;

    _messaging.onTokenRefresh.listen((newToken) {
      ref.read(fcmTokenProvider.notifier).state = newToken;
      _registerToken(newToken);
    });

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _handleForegroundMessage(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(message);
    });

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  static Future<void> registerToken() async {
    final token = await _messaging.getToken();
    if (token != null) await _registerToken(token);
  }

  static Future<void> _registerToken(String token) async {
    try {
      await ApiClient.registerDeviceToken(token);
    } catch (_) {}
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    NotificationService.showCustomNotification(
      title: notification.title ?? 'Shifoxona CRM',
      body: notification.body ?? '',
      payload: message.data['route'],
    );
  }

  static void _handleNotificationTap(RemoteMessage message) {
    final route = message.data['route'];
    if (route != null && rootNavigatorKey.currentContext != null) {
      try {
        GoRouter.of(rootNavigatorKey.currentContext!).go(route);
      } catch (_) {}
    }
  }
}
