import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';

class CacheService {
  static const _boxName = 'shifoxona_cache';
  static late Box<String> _box;

  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox<String>(_boxName);
  }

  static Future<void> put(String key, dynamic data) async {
    await _box.put(key, jsonEncode(data));
  }

  static T? get<T>(String key) {
    final raw = _box.get(key);
    if (raw == null) return null;
    return jsonDecode(raw) as T;
  }

  static Future<void> remove(String key) async {
    await _box.delete(key);
  }

  static Future<void> clear() async {
    await _box.clear();
  }

  static bool has(String key) => _box.containsKey(key);
}
