import 'package:flutter/material.dart';
import '../../../data/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../i18n/services/translation_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _loginCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _loading = false;
  bool _codeSent = false;
  bool _obscure = true;
  bool _obscureConfirm = true;

  Future<void> _sendCode() async {
    if (_loginCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ApiClient.forgotPassword(_loginCtrl.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('forgot.codeSent'))),
        );
        setState(() => _codeSent = true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('forgot.error')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (_codeCtrl.text.isEmpty || _newPassCtrl.text.isEmpty) return;
    if (_newPassCtrl.text != _confirmPassCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(TranslationService.tr('forgot.passwordMismatch')), backgroundColor: Colors.red),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiClient.resetPassword(_loginCtrl.text, _codeCtrl.text, _newPassCtrl.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('forgot.success'))),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(TranslationService.tr('forgot.error')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _loginCtrl.dispose();
    _codeCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text(TranslationService.tr('forgot.title')), backgroundColor: Colors.white),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF7C3AED)]),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.lock_reset, color: Colors.white, size: 40),
                ),
                const SizedBox(height: 24),
                Text(TranslationService.tr('forgot.title'), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(TranslationService.tr('forgot.description'), style: const TextStyle(color: Color(AppTheme.textSecondary))),
                const SizedBox(height: 32),
                if (!_codeSent) ...[
                  TextField(controller: _loginCtrl, decoration: InputDecoration(labelText: TranslationService.tr('login.login'), prefixIcon: const Icon(Icons.person)), textInputAction: TextInputAction.done, onSubmitted: (_) => _sendCode()),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity, height: 50,
                    child: FilledButton(
                      onPressed: _loading ? null : _sendCode,
                      style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: _loading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(TranslationService.tr('forgot.sendCode'), style: const TextStyle(fontSize: 16)),
                    ),
                  ),
                ] else ...[
                  TextField(controller: _codeCtrl, decoration: InputDecoration(labelText: TranslationService.tr('forgot.code'), prefixIcon: const Icon(Icons.pin)), keyboardType: TextInputType.number, textInputAction: TextInputAction.next),
                  const SizedBox(height: 16),
                  TextField(controller: _newPassCtrl, decoration: InputDecoration(labelText: TranslationService.tr('forgot.newPassword'), prefixIcon: const Icon(Icons.lock), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure))), obscureText: _obscure, textInputAction: TextInputAction.next),
                  const SizedBox(height: 16),
                  TextField(controller: _confirmPassCtrl, decoration: InputDecoration(labelText: TranslationService.tr('forgot.confirmPassword'), prefixIcon: const Icon(Icons.lock), suffixIcon: IconButton(icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm))), obscureText: _obscureConfirm, textInputAction: TextInputAction.done, onSubmitted: (_) => _resetPassword()),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity, height: 50,
                    child: FilledButton(
                      onPressed: _loading ? null : _resetPassword,
                      style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: _loading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(TranslationService.tr('forgot.reset'), style: const TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(TranslationService.tr('forgot.backToLogin')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
