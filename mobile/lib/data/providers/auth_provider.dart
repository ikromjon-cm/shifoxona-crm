import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../../features/notifications/services/fcm_service.dart';

class AuthState {
  final Map<String, dynamic>? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  String? get role => user?['role'] as String?;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await ApiClient.getToken();
    if (token != null) {
      final user = await ApiClient.getStoredUser();
      state = AuthState(user: user);
    }
  }

  Future<String?> login(String login, String password) async {
    state = const AuthState(isLoading: true);
    try {
      final user = await ApiClient.login(login, password);
      await FcmService.registerToken();
      state = AuthState(user: user);
      return null;
    } catch (e) {
      state = AuthState(error: 'Login yoki parol noto\'g\'ri');
      return 'Xatolik';
    }
  }

  void setUser(Map<String, dynamic> user) => state = AuthState(user: user);

  Future<void> logout() async {
    await ApiClient.logout();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
