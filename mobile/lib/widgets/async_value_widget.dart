import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'shimmer_list.dart';

class AsyncValueWidget<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget? loading;
  final String? errorMessage;

  const AsyncValueWidget({
    super.key,
    required this.value,
    required this.data,
    this.loading,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => loading ?? const ShimmerList(),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text(errorMessage ?? 'Xatolik yuz berdi', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 8),
            TextButton(onPressed: () {}, child: const Text('Qayta urinish')),
          ],
        ),
      ),
      data: (d) => data(d),
    );
  }
}
