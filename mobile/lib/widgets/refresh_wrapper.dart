import 'package:flutter/material.dart';

class RefreshWrapper extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const RefreshWrapper({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: Theme.of(context).colorScheme.primary,
      child: child,
    );
  }
}
