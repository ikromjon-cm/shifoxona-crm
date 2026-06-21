import 'package:flutter/material.dart';

typedef SearchFilter<T> = List<T> Function(List<T> items, String query);

class AppSearchDelegate<T> extends SearchDelegate<T> {
  final List<T> allItems;
  final SearchFilter<T> filter;
  final Widget Function(T item) itemBuilder;
  final String emptyMessage;

  AppSearchDelegate({
    required this.allItems,
    required this.filter,
    required this.itemBuilder,
    this.emptyMessage = 'Hech narsa topilmadi',
    super.searchFieldLabel,
  });

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(icon: const Icon(Icons.clear), onPressed: () => query = ''),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null as T),
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildList();

  @override
  Widget buildSuggestions(BuildContext context) => _buildList();

  Widget _buildList() {
    final results = query.isEmpty ? allItems : filter(allItems, query);
    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text(emptyMessage, style: const TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) => itemBuilder(results[index]),
    );
  }
}
