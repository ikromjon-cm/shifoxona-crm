import 'package:flutter/material.dart';
import '../../i18n/services/translation_service.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF7C3AED)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.medical_services, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 24),
            Text(TranslationService.tr('app.title'), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 32),
            const SizedBox(width: 40, height: 40, child: CircularProgressIndicator(strokeWidth: 3)),
          ],
        ),
      ),
    );
  }
}
