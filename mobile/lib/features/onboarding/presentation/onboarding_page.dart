import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../../i18n/services/translation_service.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _controller = PageController();
  final _storage = const FlutterSecureStorage();
  int _currentPage = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _complete() async {
    await _storage.write(key: 'onboarding_done', value: 'true');
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _currentPage == 2;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _controller,
                onPageChanged: (i) => setState(() => _currentPage = i),
                children: [
                  _OnboardingSlide(
                    icon: Icons.medical_services,
                    gradient: const [Color(0xFF2563EB), Color(0xFF7C3AED)],
                    title: TranslationService.tr('onboarding.title1'),
                    subtitle: TranslationService.tr('app.tagline'),
                    description: TranslationService.tr('onboarding.desc1'),
                  ),
                  _OnboardingSlide(
                    icon: Icons.inventory_2,
                    gradient: const [Color(0xFF059669), Color(0xFF10B981)],
                    title: TranslationService.tr('onboarding.title2'),
                    subtitle: '',
                    description: TranslationService.tr('onboarding.desc2'),
                  ),
                  _OnboardingSlide(
                    icon: Icons.people_alt,
                    gradient: const [Color(0xFFDC2626), Color(0xFFF97316)],
                    title: TranslationService.tr('onboarding.title3'),
                    subtitle: '',
                    description: TranslationService.tr('onboarding.desc3'),
                  ),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (i) => _Dot(isActive: i == _currentPage)),
            ),
            const SizedBox(height: 32),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () async {
                      await _complete();
                    },
                    child: Text(TranslationService.tr('onboarding.skip')),
                  ),
                  FilledButton(
                    onPressed: () async {
                      if (isLast) {
                        await _complete();
                      } else {
                        _controller.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      }
                    },
                    child: Text(
                      isLast
                          ? TranslationService.tr('onboarding.getStarted')
                          : TranslationService.tr('onboarding.next'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _OnboardingSlide extends StatelessWidget {
  final IconData icon;
  final List<Color> gradient;
  final String title;
  final String subtitle;
  final String description;

  const _OnboardingSlide({
    required this.icon,
    required this.gradient,
    required this.title,
    required this.subtitle,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(icon, color: Colors.white, size: 50),
          ),
          const SizedBox(height: 32),
          Text(
            title,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 16),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey[700], height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final bool isActive;

  const _Dot({required this.isActive});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF2563EB) : Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
