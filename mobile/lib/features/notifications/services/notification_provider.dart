import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_service.dart';

final notificationInitProvider = Provider<void>((ref) {
  ref.onDispose(() => NotificationService.stopPolling());
});
