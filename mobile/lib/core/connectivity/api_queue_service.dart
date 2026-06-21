import 'dart:collection';
import '../../core/cache/cache_service.dart';
import '../../data/api/api_client.dart';

class QueuedRequest {
  final String method;
  final String path;
  final Map<String, dynamic>? data;
  final DateTime queuedAt;

  QueuedRequest({
    required this.method,
    required this.path,
    this.data,
    DateTime? queuedAt,
  }) : queuedAt = queuedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'method': method,
    'path': path,
    'data': data,
    'queuedAt': queuedAt.toIso8601String(),
  };

  factory QueuedRequest.fromJson(Map<String, dynamic> json) => QueuedRequest(
    method: json['method'],
    path: json['path'],
    data: json['data'] as Map<String, dynamic>?,
    queuedAt: DateTime.parse(json['queuedAt']),
  );
}

class ApiQueueService {
  static const _queueKey = 'api_queue';
  static final Queue<QueuedRequest> _queue = Queue<QueuedRequest>();
  static bool _isProcessing = false;

  static Future<void> loadQueue() async {
    final raw = CacheService.get<List<dynamic>>(_queueKey);
    if (raw == null) return;
    for (final item in raw) {
      _queue.add(QueuedRequest.fromJson(item as Map<String, dynamic>));
    }
  }

  static Future<void> enqueue(QueuedRequest request) async {
    _queue.add(request);
    await _persist();
  }

  static Future<void> processQueue() async {
    if (_isProcessing || _queue.isEmpty) return;
    _isProcessing = true;

    while (_queue.isNotEmpty) {
      final request = _queue.first;
      try {
        await _execute(request);
        _queue.removeFirst();
        await _persist();
      } catch (_) {
        break;
      }
    }

    _isProcessing = false;
  }

  static Future<void> _execute(QueuedRequest request) async {
    final dio = ApiClient.dio;
    switch (request.method.toUpperCase()) {
      case 'GET':
        await dio.get(request.path);
      case 'POST':
        await dio.post(request.path, data: request.data);
      case 'PUT':
        await dio.put(request.path, data: request.data);
      case 'PATCH':
        await dio.patch(request.path, data: request.data);
      case 'DELETE':
        await dio.delete(request.path);
    }
  }

  static Future<void> _persist() async {
    final list = _queue.map((r) => r.toJson()).toList();
    await CacheService.put(_queueKey, list);
  }

  static int get pendingCount => _queue.length;
}
