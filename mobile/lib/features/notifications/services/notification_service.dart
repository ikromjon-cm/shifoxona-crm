import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../../data/api/api_service.dart';

final unreadCountProvider = StateProvider<int>((ref) => 0);

class NotificationService {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static Timer? _pollTimer;
  static int _lastCount = 0;
  static void Function(String?)? _onNotificationTap;

  static Future<void> init({void Function(String?)? onTap}) async {
    _onNotificationTap = onTap;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(requestAlertPermission: true, requestBadgePermission: true, requestSoundPermission: true);
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: (response) {
        _onNotificationTap?.call(response.payload);
      },
    );
  }

  static void startPolling(WidgetRef ref) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _checkUnread(ref));
    _checkUnread(ref);
  }

  static void stopPolling() {
    _pollTimer?.cancel();
  }

  static Future<void> _checkUnread(WidgetRef ref) async {
    try {
      final data = await ApiService.get('/notifications/notifications/unread-count/');
      final count = data['count'] as int? ?? 0;
      ref.read(unreadCountProvider.notifier).state = count;

      if (count > _lastCount) {
        _showLocalNotification(count - _lastCount);
      }
      _lastCount = count;
    } catch (_) {}
  }

  static Future<void> _showLocalNotification(int newCount) async {
    const androidDetails = AndroidNotificationDetails(
      'shifoxona_channel',
      'Shifoxona bildirishnomalari',
      channelDescription: 'Shifoxona CRM bildirishnomalari',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      'Shifoxona CRM',
      'Sizda $newCount ta yangi bildirishnoma bor',
      details,
      payload: '/notifications',
    );
  }

  static Future<void> showCustomNotification({required String title, required String body, String? payload}) async {
    const androidDetails = AndroidNotificationDetails('shifoxona_channel', 'Shifoxona bildirishnomalari', importance: Importance.high, priority: Priority.high);
    const details = NotificationDetails(android: androidDetails, iOS: DarwinNotificationDetails());
    await _plugin.show(DateTime.now().millisecondsSinceEpoch ~/ 1000, title, body, details, payload: payload);
  }
}
