import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final localeProvider = StateNotifierProvider<LocaleNotifier, String>((ref) => LocaleNotifier());

class LocaleNotifier extends StateNotifier<String> {
  LocaleNotifier() : super('uz') {
    _load();
  }

  final _storage = const FlutterSecureStorage();

  Future<void> _load() async {
    final saved = await _storage.read(key: 'locale');
    if (saved != null && ['uz', 'ru', 'en'].contains(saved)) {
      state = saved;
    }
  }

  Future<void> setLocale(String code) async {
    state = code;
    await _storage.write(key: 'locale', value: code);
  }
}

class TranslationService {
  static Map<String, dynamic> _strings = {};

  static Future<void> load(String locale) async {
    final data = await rootBundle.loadString('assets/i18n/$locale.json');
    _strings = jsonDecode(data) as Map<String, dynamic>;
  }

  static String tr(String key, {List<String>? args}) {
    final value = _strings[key];
    if (value == null) return key;

    if (args != null && value is String) {
      String result = value;
      for (int i = 0; i < args.length; i++) {
        result = result.replaceAll('{$i}', args[i]);
      }
      return result;
    }

    return value.toString();
  }
}
