import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/api/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';
import '../../../widgets/shimmer_list.dart';

final shiftsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/attendance/shifts/');
});

final geofencesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/attendance/geofence-zones/');
});

final recordsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/attendance/records/');
});

final leavesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/attendance/leave-requests/');
});

class AttendancePage extends ConsumerStatefulWidget {
  const AttendancePage({super.key});

  @override
  ConsumerState<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends ConsumerState<AttendancePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(TranslationService.tr('attendance.title')),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(text: TranslationService.tr('attendance.records')),
            Tab(text: TranslationService.tr('attendance.shifts')),
            Tab(text: TranslationService.tr('attendance.geofences')),
            Tab(text: TranslationService.tr('attendance.leaves')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          RecordsTab(),
          ShiftsTab(),
          GeofencesTab(),
          LeavesTab(),
        ],
      ),
    );
  }
}

// ─── Records Tab ──────────────────────────────────────────────

class RecordsTab extends ConsumerWidget {
  const RecordsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final records = ref.watch(recordsProvider);
    return records.when(
      loading: () => const ShimmerList(),
      error: (e, _) => Center(child: Text('Xatolik: $e')),
      data: (items) {
        if (items.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.history, size: 48, color: Colors.grey),
                SizedBox(height: 12),
                Text('Hech qanday yozuv topilmadi', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.refresh(recordsProvider.future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final item = items[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Color(AppTheme.primaryColor).withValues(alpha: 0.1),
                  child: Icon(
                    item['check_in'] != null && item['check_out'] == null
                        ? Icons.login
                        : Icons.logout,
                    color: Color(AppTheme.primaryColor),
                    size: 20,
                  ),
                ),
                title: Text(item['user_name'] ?? ''),
                subtitle: Text(
                  'Kirish: ${item['check_in'] ?? '-'}  Chiqish: ${item['check_out'] ?? '-'}',
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: Text(
                  item['method'] ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(AppTheme.primaryColor),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ─── Shifts Tab ───────────────────────────────────────────────

class ShiftsTab extends ConsumerStatefulWidget {
  const ShiftsTab({super.key});

  @override
  ConsumerState<ShiftsTab> createState() => _ShiftsTabState();
}

class _ShiftsTabState extends ConsumerState<ShiftsTab> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  String _shiftType = 'morning';
  List<int> _weekdays = [];

  void _resetForm() {
    _nameCtrl.clear();
    _startCtrl.text = '08:00';
    _endCtrl.text = '16:00';
    _shiftType = 'morning';
    _weekdays = [];
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    await ApiService.post('/attendance/shifts/', data: {
      'name': _nameCtrl.text,
      'shift_type': _shiftType,
      'start_time': _startCtrl.text,
      'end_time': _endCtrl.text,
      'weekdays': _weekdays,
    });
    ref.invalidate(shiftsProvider);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _delete(int id) async {
    await ApiService.delete('/attendance/shifts/$id/');
    ref.invalidate(shiftsProvider);
  }

  void _showForm([Map<String, dynamic>? shift]) {
    if (shift != null) {
      _nameCtrl.text = shift['name'] ?? '';
      _startCtrl.text = shift['start_time'] ?? '08:00';
      _endCtrl.text = shift['end_time'] ?? '16:00';
      _shiftType = shift['shift_type'] ?? 'morning';
      _weekdays = List<int>.from(shift['weekdays'] ?? []);
    } else {
      _resetForm();
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ShiftForm(
        formKey: _formKey,
        nameCtrl: _nameCtrl,
        startCtrl: _startCtrl,
        endCtrl: _endCtrl,
        shiftType: _shiftType,
        weekdays: _weekdays,
        onShiftTypeChanged: (v) => setState(() => _shiftType = v),
        onWeekdayToggled: (d) {
          setState(() {
            _weekdays.contains(d) ? _weekdays.remove(d) : _weekdays.add(d);
          });
        },
        onSave: _save,
      ),
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shifts = ref.watch(shiftsProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        mini: true,
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
      body: shifts.when(
        loading: () => const ShimmerList(),
        error: (e, _) => Center(child: Text('Xatolik: $e')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Smenalar mavjud emas'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(shiftsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final shift = items[i];
                final days = _weekdayLabels(_weekdays);
                return Card(
                  child: ListTile(
                    title: Text(shift['name'] ?? ''),
                    subtitle: Text(
                      '${shift['start_time']} - ${shift['end_time']}  |  $days',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, size: 18),
                          onPressed: () => _showForm(shift),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                          onPressed: () => _delete(shift['id']),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

String _weekdayLabels(List<int> days) {
  const labels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  return days.map((d) => labels[d]).join(', ');
}

class _ShiftForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController startCtrl;
  final TextEditingController endCtrl;
  final String shiftType;
  final List<int> weekdays;
  final ValueChanged<String> onShiftTypeChanged;
  final ValueChanged<int> onWeekdayToggled;
  final VoidCallback onSave;

  const _ShiftForm({
    required this.formKey,
    required this.nameCtrl,
    required this.startCtrl,
    required this.endCtrl,
    required this.shiftType,
    required this.weekdays,
    required this.onShiftTypeChanged,
    required this.onWeekdayToggled,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16, right: 16, top: 16,
      ),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Smena qo\'shish', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Smena nomi', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: shiftType,
              decoration: const InputDecoration(labelText: 'Smena turi', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'morning', child: Text('Ertalabki')),
                DropdownMenuItem(value: 'afternoon', child: Text('Tushdan keyin')),
                DropdownMenuItem(value: 'night', child: Text('Tungi')),
                DropdownMenuItem(value: 'custom', child: Text('Moslashtirilgan')),
              ],
              onChanged: (v) => onShiftTypeChanged(v ?? 'morning'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: startCtrl,
                    decoration: const InputDecoration(labelText: 'Boshlanish', border: OutlineInputBorder()),
                    readOnly: true,
                    onTap: () async {
                      final t = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 8, minute: 0));
                      if (t != null) startCtrl.text = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                    },
                    validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: endCtrl,
                    decoration: const InputDecoration(labelText: 'Tugash', border: OutlineInputBorder()),
                    readOnly: true,
                    onTap: () async {
                      final t = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 16, minute: 0));
                      if (t != null) endCtrl.text = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                    },
                    validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 4,
              children: List.generate(7, (i) {
                const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
                final selected = weekdays.contains(i);
                return ChoiceChip(
                  label: Text(days[i]),
                  selected: selected,
                  onSelected: (_) => onWeekdayToggled(i),
                );
              }),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: onSave, child: const Text('Saqlash')),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

// ─── Geofences Tab ────────────────────────────────────────────

class GeofencesTab extends ConsumerStatefulWidget {
  const GeofencesTab({super.key});

  @override
  ConsumerState<GeofencesTab> createState() => _GeofencesTabState();
}

class _GeofencesTabState extends ConsumerState<GeofencesTab> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  final _radiusCtrl = TextEditingController(text: '100');
  final _addrCtrl = TextEditingController();

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    await ApiService.post('/attendance/geofence-zones/', data: {
      'name': _nameCtrl.text,
      'latitude': double.parse(_latCtrl.text),
      'longitude': double.parse(_lngCtrl.text),
      'radius': int.parse(_radiusCtrl.text),
      'address': _addrCtrl.text,
    });
    ref.invalidate(geofencesProvider);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _delete(int id) async {
    await ApiService.delete('/attendance/geofence-zones/$id/');
    ref.invalidate(geofencesProvider);
  }

  void _showForm() {
    _nameCtrl.clear();
    _latCtrl.clear();
    _lngCtrl.clear();
    _radiusCtrl.text = '100';
    _addrCtrl.clear();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _GeofenceForm(
        formKey: _formKey,
        nameCtrl: _nameCtrl,
        latCtrl: _latCtrl,
        lngCtrl: _lngCtrl,
        radiusCtrl: _radiusCtrl,
        addrCtrl: _addrCtrl,
        onSave: _save,
      ),
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    _radiusCtrl.dispose();
    _addrCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final geofences = ref.watch(geofencesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        mini: true,
        onPressed: _showForm,
        child: const Icon(Icons.add_location),
      ),
      body: geofences.when(
        loading: () => const ShimmerList(),
        error: (e, _) => Center(child: Text('Xatolik: $e')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Geofence zonalari mavjud emas'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(geofencesProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final z = items[i];
                return Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFF059669),
                      child: Icon(Icons.pin_drop, color: Colors.white),
                    ),
                    title: Text(z['name'] ?? ''),
                    subtitle: Text(
                      '${z['latitude']?.toStringAsFixed(4)}, ${z['longitude']?.toStringAsFixed(4)} | Radius: ${z['radius']}m',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                      onPressed: () => _delete(z['id']),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _GeofenceForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController latCtrl;
  final TextEditingController lngCtrl;
  final TextEditingController radiusCtrl;
  final TextEditingController addrCtrl;
  final VoidCallback onSave;

  const _GeofenceForm({
    required this.formKey,
    required this.nameCtrl,
    required this.latCtrl,
    required this.lngCtrl,
    required this.radiusCtrl,
    required this.addrCtrl,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16, right: 16, top: 16,
      ),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Geofence qo\'shish', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Zona nomi', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: latCtrl,
                    decoration: const InputDecoration(labelText: 'Kenglik', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: lngCtrl,
                    decoration: const InputDecoration(labelText: 'Uzunlik', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                    validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: radiusCtrl,
              decoration: const InputDecoration(labelText: 'Radius (m)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: addrCtrl,
              decoration: const InputDecoration(labelText: 'Manzil', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: onSave, child: const Text('Saqlash')),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

// ─── Leaves Tab ───────────────────────────────────────────────

class LeavesTab extends ConsumerStatefulWidget {
  const LeavesTab({super.key});

  @override
  ConsumerState<LeavesTab> createState() => _LeavesTabState();
}

class _LeavesTabState extends ConsumerState<LeavesTab> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  String _leaveType = 'sick';
  String _startDate = '';
  String _endDate = '';

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    await ApiService.post('/attendance/leave-requests/', data: {
      'leave_type': _leaveType,
      'start_date': _startDate,
      'end_date': _endDate,
      'reason': _reasonCtrl.text,
    });
    ref.invalidate(leavesProvider);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _action(int id, String action) async {
    await ApiService.post('/attendance/leave-requests/$id/$action/');
    ref.invalidate(leavesProvider);
  }

  void _showForm() {
    _reasonCtrl.clear();
    _leaveType = 'sick';
    _startDate = '';
    _endDate = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _LeaveForm(
        formKey: _formKey,
        reasonCtrl: _reasonCtrl,
        leaveType: _leaveType,
        startDate: _startDate,
        endDate: _endDate,
        onLeaveTypeChanged: (v) => _leaveType = v,
        onStartDateChanged: (v) => _startDate = v,
        onEndDateChanged: (v) => _endDate = v,
        onSave: _save,
      ),
    );
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final leaves = ref.watch(leavesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        mini: true,
        onPressed: _showForm,
        child: const Icon(Icons.add),
      ),
      body: leaves.when(
        loading: () => const ShimmerList(),
        error: (e, _) => Center(child: Text('Xatolik: $e')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Arizalar mavjud emas'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(leavesProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final l = items[i];
                final statusColor = l['status'] == 'approved'
                    ? Colors.green
                    : l['status'] == 'rejected' ? Colors.red : Colors.orange;
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: statusColor.withValues(alpha: 0.1),
                      child: Text(
                        (l['user_name'] ?? '?')[0].toUpperCase(),
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text(l['user_name'] ?? ''),
                    subtitle: Text(
                      '${l['leave_type']} | ${l['start_date']} - ${l['end_date']}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: l['status'] == 'pending'
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.check_circle, color: Colors.green),
                                onPressed: () => _action(l['id'], 'approve'),
                              ),
                              IconButton(
                                icon: const Icon(Icons.cancel, color: Colors.red),
                                onPressed: () => _action(l['id'], 'reject'),
                              ),
                            ],
                          )
                        : Badge(
                            backgroundColor: statusColor,
                            textColor: Colors.white,
                            label: Text(l['status'] ?? ''),
                          ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _LeaveForm extends StatefulWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController reasonCtrl;
  final String leaveType;
  final String startDate;
  final String endDate;
  final ValueChanged<String> onLeaveTypeChanged;
  final ValueChanged<String> onStartDateChanged;
  final ValueChanged<String> onEndDateChanged;
  final VoidCallback onSave;

  const _LeaveForm({
    required this.formKey,
    required this.reasonCtrl,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.onLeaveTypeChanged,
    required this.onStartDateChanged,
    required this.onEndDateChanged,
    required this.onSave,
  });

  @override
  State<_LeaveForm> createState() => _LeaveFormState();
}

class _LeaveFormState extends State<_LeaveForm> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16, right: 16, top: 16,
      ),
      child: Form(
        key: widget.formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Ariza qo\'shish', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: widget.leaveType,
              decoration: const InputDecoration(labelText: 'Tur', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'sick', child: Text('Kasal')),
                DropdownMenuItem(value: 'vacation', child: Text('Ta\'til')),
                DropdownMenuItem(value: 'personal', child: Text('Shaxsiy')),
              ],
              onChanged: (v) => widget.onLeaveTypeChanged(v ?? 'sick'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Boshlanish sanasi', border: OutlineInputBorder()),
                    readOnly: true,
                    controller: TextEditingController(text: widget.startDate),
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now().subtract(const Duration(days: 30)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (d != null) widget.onStartDateChanged(d.toIso8601String().split('T')[0]);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Tugash sanasi', border: OutlineInputBorder()),
                    readOnly: true,
                    controller: TextEditingController(text: widget.endDate),
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (d != null) widget.onEndDateChanged(d.toIso8601String().split('T')[0]);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: widget.reasonCtrl,
              decoration: const InputDecoration(labelText: 'Sabab', border: OutlineInputBorder()),
              maxLines: 3,
              validator: (v) => (v == null || v.isEmpty) ? 'Majburiy' : null,
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: widget.onSave, child: const Text('Yuborish')),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
