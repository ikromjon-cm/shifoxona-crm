import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/shell.dart';
import '../../features/auth/presentation/forgot_password_page.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/splash_page.dart';
import '../../features/dashboard/presentation/dashboard_page.dart';
import '../../features/medicines/presentation/medicines_page.dart';
import '../../features/tasks/presentation/tasks_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/warehouse/presentation/scan_page.dart';
import '../../features/warehouse/presentation/income_page.dart';
import '../../features/warehouse/presentation/expense_page.dart';
import '../../features/warehouse/presentation/bins_page.dart';
import '../../features/warehouse/presentation/stock_reports_page.dart';
import '../../features/warehouse/presentation/order_history_page.dart';
import '../../features/warehouse/presentation/pick_orders_page.dart';
import '../../features/warehouse/presentation/movements_page.dart';
import '../../features/delivery/presentation/delivery_page.dart';
import '../../features/chat/presentation/chat_page.dart';
import '../../features/notifications/presentation/notifications_page.dart';
import '../../features/notifications/presentation/preferences_page.dart';
import '../../features/onboarding/presentation/onboarding_page.dart';
import '../../features/update/presentation/force_update_page.dart';
import '../../features/users/presentation/users_page.dart';
import '../../features/attendance/presentation/attendance_page.dart';
import '../../data/providers/auth_provider.dart';
import 'navigator_key.dart';

final _routePermissions = <String, List<String>>{
  '/users': ['superadmin', 'admin'],
  '/income': ['superadmin', 'admin', 'warehouse'],
  '/expense': ['superadmin', 'admin', 'warehouse'],
  '/bins': ['superadmin', 'admin', 'warehouse'],
  '/delivery': ['superadmin', 'admin', 'operator', 'driver', 'pharmacy'],
  '/stock-reports': ['superadmin', 'admin', 'warehouse'],
  '/order-history': ['superadmin', 'admin', 'operator', 'pharmacy'],
  '/pick-orders': ['superadmin', 'admin', 'warehouse'],
  '/movements': ['superadmin', 'admin', 'warehouse'],
  '/scan': ['superadmin', 'admin', 'warehouse'],
};

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final loggedIn = auth.user != null;
      final isLoading = auth.isLoading;
      final loggingIn = state.matchedLocation == '/login';
      final role = auth.role;

      if (isLoading && !loggedIn) return '/splash';
      if (!loggedIn && !loggingIn && !isLoading) return '/login';
      if (loggedIn && loggingIn) return '/';
      if (loggedIn && state.matchedLocation == '/splash') return '/';

      if (loggedIn && role != null) {
        final path = state.matchedLocation;
        final allowed = _routePermissions.entries
            .where((e) => path.startsWith(e.key))
            .map((e) => e.value)
            .expand((x) => x)
            .toList();
        if (allowed.isNotEmpty && !allowed.contains(role)) {
          return '/';
        }
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginPage(
          onLogin: (user) => ref.read(authProvider.notifier).setUser(user),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (context, state) => const DashboardPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/medicines', builder: (context, state) => const MedicinesPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/tasks', builder: (context, state) => const TasksPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/users', builder: (context, state) => const UsersPage()),
          ]),
        ],
      ),
      GoRoute(path: '/forgot-password', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(path: '/scan', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const ScanPage()),
      GoRoute(path: '/income', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const IncomePage()),
      GoRoute(path: '/expense', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const ExpensePage()),
      GoRoute(path: '/bins', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const BinsPage()),
      GoRoute(path: '/delivery', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const DeliveryPage()),
      GoRoute(path: '/chat', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const ChatPage()),
      GoRoute(path: '/stock-reports', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const StockReportsPage()),
      GoRoute(path: '/order-history', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const OrderHistoryPage()),
      GoRoute(path: '/pick-orders', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const PickOrdersPage()),
      GoRoute(path: '/movements', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const InventoryMovementsPage()),
      GoRoute(path: '/notifications', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const NotificationsPage()),
      GoRoute(path: '/notification-preferences', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const NotificationPreferencesPage()),
      GoRoute(path: '/attendance', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const AttendancePage()),
      GoRoute(path: '/onboarding', parentNavigatorKey: rootNavigatorKey, builder: (context, state) => const OnboardingPage()),
      GoRoute(
        path: '/force-update',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final args = state.extra as Map<String, String>?;
          return ForceUpdatePage(
            currentVersion: args?['currentVersion'] ?? '',
            requiredVersion: args?['requiredVersion'] ?? '',
          );
        },
      ),
    ],
  );
});
