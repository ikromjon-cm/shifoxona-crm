import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final onboardingDoneProvider = FutureProvider<bool>((ref) async {
  final storage = const FlutterSecureStorage();
  final value = await storage.read(key: 'onboarding_done');
  return value == 'true';
});
