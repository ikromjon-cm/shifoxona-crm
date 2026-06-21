import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/api/api_service.dart';
import '../../../../data/api/chat_ws_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

final roomsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ApiService.getList('/chat/rooms/');
});

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  String? _selectedRoom;
  final _msgCtrl = TextEditingController();
  final _messages = <Map<String, dynamic>>[];
  final _scrollCtrl = ScrollController();
  final ChatWsService _wsService = ChatWsService();
  bool _loadingMessages = false;

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _wsService.disconnect();
    super.dispose();
  }

  Future<void> _selectRoom(String roomId) async {
    _wsService.disconnect();
    setState(() {
      _selectedRoom = roomId;
      _messages.clear();
      _loadingMessages = true;
    });
    await _loadMessages(roomId);
    _wsService.messages?.listen((msg) {
      if (!mounted) return;
      setState(() {
        if (msg['type'] == 'new_message') {
          _messages.add({
            'id': msg['id'],
            'text': msg['message'],
            'sender': msg['user_id'] == 0 ? 'me' : 'them',
            'user_name': msg['user_name'],
            'created_at': msg['created_at'],
          });
        } else if (msg['type'] == 'recent_messages') {
          setState(() {
            _messages.clear();
            for (final m in msg['messages']) {
              _messages.add({
                'id': m['id'],
                'text': m['message'],
                'sender': 'them',
                'user_name': m['user_name'],
                'created_at': m['created_at'],
              });
            }
          });
        }
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    });
    _wsService.connect(roomId);
    setState(() => _loadingMessages = false);
  }

  Future<void> _loadMessages(String roomId) async {
    try {
      final data = await ApiService.getList('/chat/rooms/$roomId/messages/');
      setState(() => _messages.addAll(data.cast<Map<String, dynamic>>()));
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (_) {}
  }

  void _sendMessage() {
    if (_msgCtrl.text.trim().isEmpty || _selectedRoom == null) return;
    final text = _msgCtrl.text;
    _msgCtrl.clear();
    setState(() {
      _messages.add({
        'text': text,
        'sender': 'me',
        'user_name': 'Men',
        'created_at': DateTime.now().toIso8601String(),
      });
    });
    _wsService.sendMessage(text);
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  void _scrollToBottom() {
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rooms = ref.watch(roomsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(TranslationService.tr('chat.title'))),
      body: rooms.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${TranslationService.tr('common.error')}: $e')),
        data: (roomList) => Row(
          children: [
            SizedBox(
              width: 90,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: roomList.length,
                itemBuilder: (context, index) {
                  final r = roomList[index];
                  final selected = '${r['id']}' == _selectedRoom;
                  return GestureDetector(
                    onTap: () => _selectRoom('${r['id']}'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                      decoration: BoxDecoration(
                        color: selected ? const Color(AppTheme.primaryColor).withValues(alpha: 0.1) : null,
                        border: selected ? const Border(right: BorderSide(color: Color(AppTheme.primaryColor), width: 3)) : null,
                      ),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: const Color(AppTheme.primaryColor).withValues(alpha: 0.2),
                            child: Text(
                              (r['name']?.toString().isNotEmpty == true ? r['name'].toString()[0].toUpperCase() : '?'),
                              style: const TextStyle(color: Color(AppTheme.primaryColor), fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(r['name'] ?? '', style: const TextStyle(fontSize: 10), maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(
              child: _selectedRoom == null
                ? Center(child: Text(TranslationService.tr('chat.selectRoom'), style: const TextStyle(color: Color(AppTheme.textSecondary))))
                : Column(
                    children: [
                      Expanded(
                        child: _loadingMessages
                          ? const Center(child: CircularProgressIndicator())
                          : _messages.isEmpty
                            ? Center(child: Text(TranslationService.tr('chat.noMessages'), style: const TextStyle(color: Color(AppTheme.textSecondary))))
                            : ListView.builder(
                                controller: _scrollCtrl,
                                padding: const EdgeInsets.all(12),
                                itemCount: _messages.length,
                                itemBuilder: (context, index) {
                                  final m = _messages[index];
                                  final isMe = m['sender'] == 'me';
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        if (!isMe) ...[
                                          CircleAvatar(
                                            radius: 12,
                                            backgroundColor: const Color(AppTheme.primaryColor).withValues(alpha: 0.2),
                                            child: Text((m['user_name'] ?? '?').toString().substring(0, 1).toUpperCase(), style: const TextStyle(fontSize: 10, color: Color(AppTheme.primaryColor))),
                                          ),
                                          const SizedBox(width: 6),
                                        ],
                                        Flexible(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: isMe ? const Color(AppTheme.primaryColor) : const Color(0xFFF1F4F9),
                                              borderRadius: BorderRadius.circular(16).copyWith(
                                                bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
                                                bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
                                              ),
                                            ),
                                            child: Text(m['text'] ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 14)),
                                          ),
                                        ),
                                        if (isMe) const SizedBox(width: 6),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _msgCtrl,
                                decoration: InputDecoration(
                                  hintText: TranslationService.tr('chat.placeholder'),
                                  isDense: true,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                                  filled: true,
                                  fillColor: const Color(0xFFF1F5F9),
                                ),
                                onSubmitted: (_) => _sendMessage(),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              decoration: const BoxDecoration(
                                color: Color(AppTheme.primaryColor),
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.send, color: Colors.white, size: 20),
                                onPressed: _sendMessage,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
