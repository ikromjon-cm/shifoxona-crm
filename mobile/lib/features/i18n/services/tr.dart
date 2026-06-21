import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'translation_service.dart';

final trProvider = Provider.family<String, String>((ref, key) {
  return TranslationService.tr(key);
});

String tr(WidgetRef ref, String key, {List<String>? args}) {
  return TranslationService.tr(key, args: args);
}
