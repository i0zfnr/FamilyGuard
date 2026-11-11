# Android agent prototype

The debug app has an explicit local consent checkbox, generates an RSA signing key in Android Keystore, encrypts the device credential using an Android Keystore AES key, and sends health only when requested from the visible app. It requires HTTPS and does not follow HTTP redirects. The device token expires after 30 days; renewal and rotation are not implemented. Removing local data does not revoke server access; use the dashboard to revoke the device as well.

Build with JDK 17 and Android SDK platform 36 / build tools 36:

```powershell
cd apps/android
.\gradlew.bat assembleDebug
```

The debug APK is at `app/build/outputs/apk/debug/app-debug.apk`. This is not a production-signed release. The admin sign-in screen uses the XennGuard Supabase project by default; confirm your email before signing in. On an authorized test device, use only after reviewing the experimental enrollment protocol and getting explicit device-owner approval. Backend enrollment is controlled by `XENNGUARD_ENROLLMENT_ENABLED` and defaults to enabled unless set to `false`. Manual challenge entry is supported; QR scanning is not. If enrollment succeeds on the server but saving the credential fails on the phone, revoke the device in the dashboard before retrying.

The server's `owner_approved` flag is a client assertion and cannot prove who used the app; do not deploy this prototype publicly. There is no location, ring, screen capture, remote control, background heartbeat, accessibility service or foreground service. No Android device was connected during this build, so enrollment, Keystore persistence and telemetry are not yet verified on hardware.

Platform references: [Android Keystore](https://developer.android.com/privacy-and-security/keystore) and [Android network security configuration](https://developer.android.com/privacy-and-security/security-config).

The Android prototype also offers account sign-in and a first-page device list over HTTPS. Its session is held in memory and does not persist after activity recreation. The sign-in defaults and error guidance have unit coverage, but sign-in has not been tested on a physical phone. QR scanning and the requested device-originated pairing workflow are not implemented. Pairing does not give remote control. Any screen assistance would require explicit target-owner approval, Android OS permissions, and visible indicators.
