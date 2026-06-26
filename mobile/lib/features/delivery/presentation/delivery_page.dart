import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import '../../../../data/api/api_service.dart';
import '../../../../widgets/loading_overlay.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final deliveriesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/delivery/deliveries/');
});

class DeliveryPage extends ConsumerStatefulWidget {
  const DeliveryPage({super.key});

  @override
  ConsumerState<DeliveryPage> createState() => _DeliveryPageState();
}

class _DeliveryPageState extends ConsumerState<DeliveryPage> {
  final ImagePicker _picker = ImagePicker();
  bool _loading = false;
  LatLng? _currentPos;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      bool enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        await Geolocator.openLocationSettings();
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        setState(() => _currentPos = LatLng(pos.latitude, pos.longitude));
        return;
      }
    } catch (_) {}
    setState(() => _currentPos = const LatLng(41.2995, 69.2401));
  }

  Future<void> _takePhoto(int deliveryId) async {
    final xfile = await _picker.pickImage(source: ImageSource.camera);
    if (xfile == null) return;
    try {
      await ApiService.uploadFile('/delivery/deliveries/$deliveryId/photo/', xfile.path);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('delivery.photoUploaded')), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${TranslationService.tr('common.error')}: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _updateStatus(int id, String status) async {
    setState(() => _loading = true);
    try {
      await ApiService.patch('/delivery/deliveries/$id/', data: {'status': status});
      ref.invalidate(deliveriesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status: $status'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${TranslationService.tr('common.error')}: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final deliveries = ref.watch(deliveriesProvider);

    return LoadingOverlay(
      isLoading: _loading,
      child: Scaffold(
        appBar: AppBar(title: Text(TranslationService.tr('delivery.title'))),
        body: deliveries.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
          data: (items) => RefreshIndicator(
            onRefresh: () async => ref.invalidate(deliveriesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length + (_currentPos != null ? 1 : 0),
              itemBuilder: (context, index) {
                if (_currentPos != null && index == 0) {
                  return _buildMapCard();
                }
                final d = items[index - (_currentPos != null ? 1 : 0)];
                return _buildDeliveryCard(d);
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMapCard() {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 200,
          child: FlutterMap(
            options: MapOptions(
              initialCenter: _currentPos ?? const LatLng(41.2995, 69.2401),
              initialZoom: 13,
            ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'uz.shifoxona.mobile',
            ),
            if (_currentPos != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentPos!,
                    width: 40, height: 40,
                    child: const Icon(Icons.location_on, color: Color(AppTheme.primaryColor), size: 40),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryCard(Map<String, dynamic> d) {
    final status = d['status'] ?? 'pending';
    final statusColor = status == 'completed' ? Colors.green : status == 'in_transit' ? Colors.orange : Colors.grey;
    final statusLabelKey = status == 'completed' ? 'delivery.completed' : status == 'in_transit' ? 'delivery.inTransit' : 'delivery.pending';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(Icons.local_shipping, color: statusColor),
        ),
        title: Text(d['order_number'] ?? '${TranslationService.tr('delivery.title')} #${d['id']}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${d['address'] ?? ''} • ${d['client_name'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: Chip(label: Text(TranslationService.tr(statusLabelKey), style: TextStyle(fontSize: 11, color: statusColor)), backgroundColor: statusColor.withValues(alpha: 0.1)),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                if (status != 'completed')
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.camera_alt, size: 18),
                      label: Text(TranslationService.tr('delivery.takePhoto')),
                      onPressed: () => _takePhoto(d['id']),
                    ),
                  ),
                if (status == 'pending') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.play_arrow, size: 18),
                      label: Text(TranslationService.tr('delivery.go')),
                      onPressed: () => _updateStatus(d['id'], 'in_transit'),
                    ),
                  ),
                ],
                if (status == 'in_transit') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.check, size: 18),
                      label: Text(TranslationService.tr('delivery.delivered')),
                      style: FilledButton.styleFrom(backgroundColor: Colors.green),
                      onPressed: () => _updateStatus(d['id'], 'completed'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
