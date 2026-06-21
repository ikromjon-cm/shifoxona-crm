import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';
import '../services/biometric_service.dart';

class LoginPage extends StatefulWidget {
  final void Function(Map<String, dynamic> user)? onLogin;
  const LoginPage({super.key, this.onLogin});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _loginCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _biometricAvailable = false;
  bool _showUrlField = false;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _currentUrl = ApiClient.baseUrl;
    _showUrlField = false;
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final available = await BiometricService.isAvailable();
    if (mounted) setState(() => _biometricAvailable = available);
  }

  Future<void> _login() async {
    if (_loginCtrl.text.isEmpty || _passCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final user = await ApiClient.login(_loginCtrl.text, _passCtrl.text);
      widget.onLogin?.call(user);
    } catch (e) {
      final isConn = e.toString().contains('Connection');
      if (isConn && mounted) {
        setState(() => _showUrlField = true);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isConn
                ? 'Serverga ulanishmadi. URL ni tekshiring'
                : TranslationService.tr('login.error')),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changeUrl() async {
    final ctrl = TextEditingController(text: _currentUrl);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Server URL', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: ctrl,
                decoration: const InputDecoration(
                  labelText: 'Server URL',
                  hintText: 'http://192.168.1.100:8000/api/v1',
                  prefixIcon: Icon(Icons.dns_outlined),
                ),
                keyboardType: TextInputType.url,
                autofocus: true,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity, height: 48,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: AppColors.gradientPrimary,
                  ),
                  child: FilledButton(
                    onPressed: () => Navigator.pop(ctx, ctrl.text),
                    style: FilledButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                    child: const Text('Saqlash', style: TextStyle(color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (result != null && result.isNotEmpty) {
      await ApiClient.configure(result);
      setState(() {
        _currentUrl = result;
        _showUrlField = false;
      });
    }
  }

  Future<void> _biometricLogin() async {
    final authenticated = await BiometricService.authenticate();
    if (authenticated) {
      final credentials = await ApiClient.getStoredCredentials();
      if (credentials != null) {
        setState(() => _loading = true);
        try {
          final user = await ApiClient.login(credentials['login']!, credentials['password']!);
          widget.onLogin?.call(user);
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(TranslationService.tr('login.biometricFailed')), backgroundColor: AppColors.warning),
            );
          }
        } finally {
          if (mounted) setState(() => _loading = false);
        }
      }
    }
  }

  @override
  void dispose() {
    _loginCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // ── Top gradient area ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 40, 24, 40),
                decoration: const BoxDecoration(
                  gradient: AppColors.gradientPrimary,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(40),
                    bottomRight: Radius.circular(40),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(Icons.medical_services, color: Colors.white, size: 48),
                    ),
                    const SizedBox(height: 24),
                    Text(TranslationService.tr('app.title'),
                      style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    Text(TranslationService.tr('app.tagline'),
                      style: GoogleFonts.poppins(fontSize: 14, color: Colors.white.withValues(alpha: 0.85)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Form ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    // ── Server URL indicator / field ──
                    if (_showUrlField) ...[
                      TextField(
                        controller: TextEditingController(text: _currentUrl),
                        decoration: InputDecoration(
                          labelText: 'Server URL',
                          hintText: 'http://192.168.1.100:8000/api/v1',
                          prefixIcon: Container(
                            padding: const EdgeInsets.all(12),
                            child: ShaderMask(
                              shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                              child: const Icon(Icons.dns_outlined, color: Colors.white),
                            ),
                          ),
                          helperText: 'Telefon va kompyuter bir WiFi da bo\'lishi kerak',
                          helperMaxLines: 2,
                        ),
                        keyboardType: TextInputType.url,
                        textInputAction: TextInputAction.next,
                        onChanged: (v) async {
                          if (v.isNotEmpty && v != _currentUrl) {
                            await ApiClient.configure(v);
                            _currentUrl = v;
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                    ] else ...[
                      // Server indicator (compact)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Material(
                          color: AppColors.primary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: _changeUrl,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              child: Row(
                                children: [
                                  ShaderMask(
                                    shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                                    child: const Icon(Icons.dns_outlined, color: Colors.white, size: 18),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(_currentUrl,
                                      style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textSecondary),
                                      maxLines: 1, overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const Icon(Icons.edit_outlined, color: AppColors.textTertiary, size: 16),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],

                    // Login
                    TextField(
                      controller: _loginCtrl,
                      decoration: InputDecoration(
                        labelText: TranslationService.tr('login.login'),
                        prefixIcon: Container(
                          padding: const EdgeInsets.all(12),
                          child: ShaderMask(
                            shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                            child: const Icon(Icons.person_outline, color: Colors.white),
                          ),
                        ),
                      ),
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),

                    // Password
                    TextField(
                      controller: _passCtrl,
                      decoration: InputDecoration(
                        labelText: TranslationService.tr('login.password'),
                        prefixIcon: Container(
                          padding: const EdgeInsets.all(12),
                          child: ShaderMask(
                            shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                            child: const Icon(Icons.lock_outline, color: Colors.white),
                          ),
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: AppColors.textSecondary),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      obscureText: _obscure,
                      onSubmitted: (_) => _login(),
                    ),
                    const SizedBox(height: 28),

                    // Sign In button
                    SizedBox(
                      width: double.infinity, height: 52,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          gradient: AppColors.gradientPrimary,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: FilledButton(
                          onPressed: _loading ? null : _login,
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: _loading
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                              : Text(TranslationService.tr('login.signIn'),
                                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Forgot password
                    TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/forgot-password'),
                      child: Text(TranslationService.tr('login.forgotPassword'),
                        style: GoogleFonts.poppins(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w500),
                      ),
                    ),

                    // Biometric
                    if (_biometricAvailable) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity, height: 50,
                        child: OutlinedButton.icon(
                          onPressed: _loading ? null : _biometricLogin,
                          icon: ShaderMask(
                            shaderCallback: (bounds) => AppColors.gradientPrimary.createShader(bounds),
                            child: const Icon(Icons.fingerprint, color: Colors.white),
                          ),
                          label: Text(TranslationService.tr('login.biometric'),
                            style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500, color: AppColors.primary)),
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
