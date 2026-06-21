import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ChatWsService {
  WebSocketChannel? _channel;
  final _storage = const FlutterSecureStorage();
  StreamController<Map<String, dynamic>>? _controller;
  Timer? _pingTimer;
  String? _currentRoomId;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  Stream<Map<String, dynamic>>? get messages => _controller?.stream;

  bool get isConnected => _channel != null;

  Future<void> connect(String roomId) async {
    _currentRoomId = roomId;
    _reconnectAttempts = 0;
    await _doConnect();
  }

  Future<void> _doConnect() async {
    if (_currentRoomId == null) return;

    final token = await _storage.read(key: 'access_token');
    if (token == null) return;

    _controller?.close();
    _controller = StreamController<Map<String, dynamic>>.broadcast();

    final wsUrl = 'ws://10.0.2.2:80/ws/chat/$_currentRoomId/?token=$token';
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _channel!.stream.listen(
        (data) {
          final message = jsonDecode(data as String) as Map<String, dynamic>;
          _controller?.add(message);
        },
        onError: (error) {
          _controller?.add({'type': 'error', 'message': '$error'});
          _reconnect();
        },
        onDone: () {
          _reconnect();
        },
      );

      _reconnectAttempts = 0;
      _startPing();
    } catch (e) {
      _controller?.add({'type': 'error', 'message': 'Ulanish xatosi: $e'});
      _reconnect();
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      try {
        _channel?.sink.add(jsonEncode({'action': 'ping'}));
      } catch (_) {}
    });
  }

  void _reconnect() {
    _pingTimer?.cancel();
    if (_reconnectAttempts >= _maxReconnectAttempts || _currentRoomId == null) return;
    _reconnectAttempts++;
    Future.delayed(Duration(seconds: _reconnectAttempts * 2), _doConnect);
  }

  void sendMessage(String text) {
    if (_channel == null) return;
    _channel!.sink.add(jsonEncode({
      'action': 'send',
      'message': text,
    }));
  }

  void disconnect() {
    _pingTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    _controller?.close();
    _currentRoomId = null;
    _reconnectAttempts = 0;
  }
}
