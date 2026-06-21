import 'package:flutter/material.dart';

enum TabAction { branch, push }

class BottomTab {
  final IconData icon;
  final IconData activeIcon;
  final String labelKey;
  final int? branchIndex;
  final String? pushRoute;

  const BottomTab({
    required this.icon,
    required this.activeIcon,
    required this.labelKey,
    this.branchIndex,
    this.pushRoute,
  });

  TabAction get action =>
      branchIndex != null ? TabAction.branch : TabAction.push;
}

const roleTabs = {
  'superadmin': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.medication_outlined, activeIcon: Icons.medication,
        labelKey: 'nav.medicines', branchIndex: 1),
    BottomTab(icon: Icons.people_outlined, activeIcon: Icons.people,
        labelKey: 'nav.users', pushRoute: '/users'),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'admin': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.medication_outlined, activeIcon: Icons.medication,
        labelKey: 'nav.medicines', branchIndex: 1),
    BottomTab(icon: Icons.people_outlined, activeIcon: Icons.people,
        labelKey: 'nav.users', pushRoute: '/users'),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'warehouse': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2,
        labelKey: 'nav.warehouse', pushRoute: '/income'),
    BottomTab(icon: Icons.task_outlined, activeIcon: Icons.task,
        labelKey: 'nav.tasks', branchIndex: 2),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'pharmacy': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.medication_outlined, activeIcon: Icons.medication,
        labelKey: 'nav.medicines', branchIndex: 1),
    BottomTab(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long,
        labelKey: 'nav.orderHistory', pushRoute: '/order-history'),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'driver': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.local_shipping_outlined, activeIcon: Icons.local_shipping,
        labelKey: 'nav.delivery', pushRoute: '/delivery'),
    BottomTab(icon: Icons.task_outlined, activeIcon: Icons.task,
        labelKey: 'nav.tasks', branchIndex: 2),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'finance': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.assessment_outlined, activeIcon: Icons.assessment,
        labelKey: 'nav.stockReports', pushRoute: '/stock-reports'),
    BottomTab(icon: Icons.task_outlined, activeIcon: Icons.task,
        labelKey: 'nav.tasks', branchIndex: 2),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
  'operator': [
    BottomTab(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard,
        labelKey: 'nav.dashboard', branchIndex: 0),
    BottomTab(icon: Icons.medication_outlined, activeIcon: Icons.medication,
        labelKey: 'nav.medicines', branchIndex: 1),
    BottomTab(icon: Icons.task_outlined, activeIcon: Icons.task,
        labelKey: 'nav.tasks', branchIndex: 2),
    BottomTab(icon: Icons.person_outlined, activeIcon: Icons.person,
        labelKey: 'nav.profile', branchIndex: 3),
  ],
};

const defaultRole = 'operator';

List<BottomTab> getTabsForRole(String? role) {
  return roleTabs[role] ?? roleTabs[defaultRole]!;
}

typedef DrawerItemDef = ({
  String id,
  IconData icon,
  String labelKey,
  int? branchIndex,
  String? pushRoute,
});

const allDrawerItems = <DrawerItemDef>[
  (id: 'dashboard', icon: Icons.dashboard, labelKey: 'nav.dashboard', branchIndex: 0, pushRoute: null),
  (id: 'medicines', icon: Icons.medication, labelKey: 'nav.medicines', branchIndex: 1, pushRoute: null),
  (id: 'users', icon: Icons.people, labelKey: 'nav.users', branchIndex: null, pushRoute: '/users'),
  (id: 'stockIncome', icon: Icons.add_shopping_cart, labelKey: 'nav.stockIncome', branchIndex: null, pushRoute: '/income'),
  (id: 'stockExpense', icon: Icons.remove_shopping_cart, labelKey: 'nav.stockExpense', branchIndex: null, pushRoute: '/expense'),
  (id: 'stockBins', icon: Icons.inventory_2, labelKey: 'nav.stockBins', branchIndex: null, pushRoute: '/bins'),
  (id: 'scanner', icon: Icons.qr_code_scanner, labelKey: 'nav.scanner', branchIndex: null, pushRoute: '/scan'),
  (id: 'delivery', icon: Icons.local_shipping, labelKey: 'nav.delivery', branchIndex: null, pushRoute: '/delivery'),
  (id: 'tasks', icon: Icons.task, labelKey: 'nav.tasks', branchIndex: 2, pushRoute: null),
  (id: 'chat', icon: Icons.chat, labelKey: 'nav.chat', branchIndex: null, pushRoute: '/chat'),
  (id: 'pickOrders', icon: Icons.receipt_long, labelKey: 'nav.pickOrders', branchIndex: null, pushRoute: '/pick-orders'),
  (id: 'movements', icon: Icons.swap_vert, labelKey: 'nav.movements', branchIndex: null, pushRoute: '/movements'),
  (id: 'stockReports', icon: Icons.assessment, labelKey: 'nav.stockReports', branchIndex: null, pushRoute: '/stock-reports'),
  (id: 'orderHistory', icon: Icons.history, labelKey: 'nav.orderHistory', branchIndex: null, pushRoute: '/order-history'),
  (id: 'notifications', icon: Icons.notifications, labelKey: 'nav.notifications', branchIndex: null, pushRoute: '/notifications'),
  (id: 'attendance', icon: Icons.calendar_today, labelKey: 'nav.attendance', branchIndex: null, pushRoute: '/attendance'),
  (id: 'profile', icon: Icons.person, labelKey: 'nav.profile', branchIndex: 3, pushRoute: null),
];

const roleDrawerIds = {
  'superadmin': [
    'dashboard', 'medicines', 'users', 'stockIncome', 'stockExpense',
    'stockBins', 'scanner', 'delivery', 'pickOrders', 'movements',
    'stockReports', 'orderHistory', 'tasks', 'chat', 'notifications',
    'attendance',
  ],
  'admin': [
    'dashboard', 'medicines', 'users', 'stockIncome', 'stockExpense',
    'stockBins', 'scanner', 'delivery', 'pickOrders', 'movements',
    'stockReports', 'orderHistory', 'tasks', 'chat', 'notifications',
    'attendance',
  ],
  'warehouse': [
    'dashboard', 'medicines', 'stockIncome', 'stockExpense', 'stockBins',
    'scanner', 'tasks', 'chat', 'pickOrders', 'movements',
    'stockReports', 'orderHistory', 'notifications',
  ],
  'pharmacy': [
    'dashboard', 'medicines', 'orderHistory', 'stockReports', 'notifications', 'chat',
  ],
  'driver': [
    'dashboard', 'delivery', 'tasks', 'chat', 'notifications',
  ],
  'finance': [
    'dashboard', 'stockReports', 'orderHistory', 'stockIncome', 'stockExpense',
    'notifications',
  ],
  'operator': [
    'dashboard', 'medicines', 'orderHistory', 'delivery', 'tasks', 'chat', 'notifications',
  ],
};

List<DrawerItemDef> getDrawerItemsForRole(String? role) {
  final ids = roleDrawerIds[role] ?? roleDrawerIds[defaultRole]!;
  final itemMap = {for (final item in allDrawerItems) item.id: item};
  return ids.map((id) => itemMap[id]!).toList();
}
