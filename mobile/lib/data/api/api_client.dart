import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/connectivity/offline_queue_interceptor.dart';

const String _defaultBaseUrl = String.fromEnvironment('SERVER_URL', defaultValue: 'http://10.0.2.2:8000/api/v1');

class ApiClient {
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static String _baseUrl = _defaultBaseUrl;
  static Dio? _dio;

  static Future<void> init() async {
    _baseUrl = await _storage.read(key: 'server_url') ?? _defaultBaseUrl;
    _createDio();
  }

  static Future<void> configure(String url) async {
    _baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    await _storage.write(key: 'server_url', value: _baseUrl);
    _createDio();
  }

  static String get baseUrl => _baseUrl;

  static void _createDio() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio!.interceptors.add(OfflineQueueInterceptor());
    _dio!.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              final res = await Dio().post('$_baseUrl/accounts/token/refresh/', data: {'refresh': refreshToken});
              final newToken = res.data['access'];
              await _storage.write(key: 'access_token', value: newToken);
              error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              final retryRes = await _dio!.fetch(error.requestOptions);
              handler.resolve(retryRes);
              return;
            } catch (_) {
              await _storage.deleteAll();
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  static Dio get dio {
    if (_dio == null) _createDio();
    return _dio!;
  }

  static Future<Map<String, dynamic>> login(String login, String password) async {
    final res = await dio.post('/accounts/login/', data: {'login': login, 'password': password});
    final data = res.data;
    final user = data['user'] as Map<String, dynamic>;
    await _storage.write(key: 'access_token', value: data['tokens']['access']);
    await _storage.write(key: 'refresh_token', value: data['tokens']['refresh']);
    await _storage.write(key: 'user', value: login);
    await _storage.write(key: 'login', value: login);
    await _storage.write(key: 'password', value: password);
    await _storage.write(key: 'user_data', value: Uri.encodeComponent(jsonEncode(user)));
    return user;
  }

  static Future<Map<String, String>?> getStoredCredentials() async {
    final login = await _storage.read(key: 'login');
    final password = await _storage.read(key: 'password');
    if (login != null && password != null) return {'login': login, 'password': password};
    return null;
  }

  static Future<void> logout() async {
    await _storage.deleteAll();
  }

  static Future<Map<String, dynamic>?> getStoredUser() async {
    final raw = await _storage.read(key: 'user_data');
    if (raw != null) {
      try {
        return jsonDecode(Uri.decodeComponent(raw)) as Map<String, dynamic>;
      } catch (_) {}
    }
    final user = await _storage.read(key: 'user');
    if (user != null) return {'login': user};
    return null;
  }

  static Future<String?> getToken() => _storage.read(key: 'access_token');

  static Future<void> forgotPassword(String login) async {
    await dio.post('/accounts/forgot-password/', data: {'login': login});
  }

  static Future<void> resetPassword(String login, String code, String newPassword) async {
    await dio.post('/accounts/reset-password/', data: {
      'login': login,
      'code': code,
      'new_password': newPassword,
    });
  }

  static Future<void> registerDeviceToken(String token, {String platform = 'android'}) async {
    await dio.post('/notifications/device-token/', data: {
      'token': token,
      'platform': platform,
    });
  }
}
