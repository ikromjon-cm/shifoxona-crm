import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web not supported');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError('iOS not supported');
      default:
        throw UnsupportedError('Platform not supported');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAUKXoHfVvZlAjI8NV_4gd_NZaS5jt8l1I',
    appId: '1:669165873160:android:320847f6073fdc3e8509bd',
    messagingSenderId: '669165873160',
    projectId: 'shifoxona-6183e',
    storageBucket: 'shifoxona-6183e.firebasestorage.app',
  );
}
