import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../i18n/services/translation_service.dart';

class ForceUpdatePage extends StatelessWidget {
  final String currentVersion;
  final String requiredVersion;

  const ForceUpdatePage({
    super.key,
    required this.currentVersion,
    required this.requiredVersion,
  });

  Future<void> _update() async {
    Uri uri;
    if (Platform.isAndroid) {
      uri = Uri.parse('https://play.google.com/store/apps/details?id=com.shifoxona.shifoxona_mobile');
    } else {
      uri = Uri.parse('https://apps.apple.com/app/idYOUR_APP_ID');
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.system_update, color: Colors.white, size: 50),
              ),
              const SizedBox(height: 32),
              Text(
                TranslationService.tr('update.title'),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                TranslationService.tr('update.message'),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.grey[600], height: 1.5),
              ),
              const SizedBox(height: 24),
              Text(
                '$currentVersion → $requiredVersion',
                style: TextStyle(fontSize: 14, color: Colors.grey[400]),
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: _update,
                icon: const Icon(Icons.download),
                label: Text(TranslationService.tr('update.button')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
