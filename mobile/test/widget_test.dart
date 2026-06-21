import 'package:flutter_test/flutter_test.dart';
import 'package:shifoxona_mobile/app/app.dart';

void main() {
  testWidgets('App loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const ShifoxonaApp());
    expect(find.text('Shifoxona CRM'), findsNothing);
  });
}
