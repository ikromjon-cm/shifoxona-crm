# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }

# App
-keep class com.shifoxona.** { *; }

# Dio/Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclassmembers,allowshrinking interface * {
    @retrofit2.http.* <methods>;
}

# Gson
-keep class com.google.gson.** { *; }
-keepattributes EnclosingMethod

# Play Core (needed by Flutter)
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }

# Mobile Scanner
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Keep model classes used by json
-keepclassmembers class com.shifoxona.shifoxona_mobile.** {
    <fields>;
}
