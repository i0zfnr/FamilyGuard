# Handoff Report — Milestone M3 (Device Agents: Android & Windows)

## 1. Observation

### Android Agent (`apps/android`)
- **Dependencies & Manifest**:
  - `app/build.gradle.kts`: Added `androidx.work:work-runtime-ktx:2.9.1`, `androidx.core:core-ktx:1.13.1`, `testImplementation("org.json:json:20240303")`, and configured `testOptions.unitTests.isReturnDefaultValues = true`.
  - `app/src/main/AndroidManifest.xml`: Declared `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_DATA_SYNC`, `ACCESS_NETWORK_STATE`, and `RECEIVE_BOOT_COMPLETED`. Added service registration for `ZeroCovertNotificationService` with `foregroundServiceType="dataSync"` and broadcast receiver `BootReceiver`.
- **Telemetry & Background Execution**:
  - `TelemetryCollector.kt`: Collects battery level (0-100%) and charging state via `BatteryManager`, total and available storage bytes via `StatFs`, and active network transport (`wifi`, `cellular`, `ethernet`, `none`, `other`) via `ConnectivityManager.getNetworkCapabilities()`.
  - `TelemetryWorker.kt`: Extends `CoroutineWorker`, executes periodic heartbeats (`POST /api/v1/agent/heartbeat`) and telemetry reporting (`POST /api/v1/agent/telemetry`), updates ongoing notification status, and exposes `schedulePeriodic(context)` (15-min interval) and `enqueueImmediate(context)`.
  - `ZeroCovertNotificationService.kt`: Persistent ongoing foreground service notification in channel `"XennGuard Active Protection"` (`IMPORTANCE_LOW`) ensuring zero covert tracking.
  - `BootReceiver.kt`: Automatically resumes foreground indicator and WorkManager periodic scheduling when device boots if enrolled.
- **Pairing & UI Hardening**:
  - `PairingPayloadParser.kt`: Validates and parses pairing payloads from JSON objects and `xennguard://` deep-link URIs with UUID and 64-character hex secret validation.
  - `MainActivity.kt`: Upgraded Compose UI featuring a 3-point explicit consent checklist (device ownership, telemetry permission, ongoing notification transparency), QR/payload autofill, active status card, manual health report button, and local credential clearing.
  - `DeviceStore.kt`: Preserved Android Keystore RSA-2048 identity keypair generation and AES-GCM credential encryption.
- **Android Test & Build Results**:
  - Execution command: `cd C:\laragon\www\FamilyGuard\apps\android; .\gradlew.bat testDebugUnitTest`
  - Output: `BUILD SUCCESSFUL in 29s`. Total 16 unit tests executed across `ServerAddressTest`, `TelemetryPayloadTest`, `PairingPayloadParserTest`, and `AndroidCryptoPrimitivesTest`. 0 failures, 0 ignored, 100% success rate (`app/build/reports/tests/testDebugUnitTest/index.html`).
  - Debug APK compilation: `cd C:\laragon\www\FamilyGuard\apps\android; .\gradlew.bat assembleDebug`
  - Output: `BUILD SUCCESSFUL in 35s`. Generated `app-debug.apk` (10,896,732 bytes at `app/build/outputs/apk/debug/app-debug.apk`).

### Windows Agent (`apps/windows-agent`)
- **Native Implementation Architecture**:
  - `src/Crypto/WindowsCryptoStore.cs`: Implements RSA-2048 keypair generation targeting `Microsoft Enhanced RSA and AES Cryptographic Provider` / CNG with key container `XennGuard_Device_Identity_RSA`. Implements X.509 SubjectPublicKeyInfo DER encoder producing standard PEM format (`-----BEGIN PUBLIC KEY-----\n...`). Implements `SHA256withRSA` signature generation over `challenge_id:challenge_token`. Implements Windows DPAPI credential storage (`ProtectedData.Protect` / `Unprotect` with `DataProtectionScope.CurrentUser` and custom entropy salt).
  - `src/Telemetry/WindowsTelemetryCollector.cs`: Queries `SystemInformation.PowerStatus` for battery capacity and AC line status, `DriveInfo.GetDrives()` for system storage metrics, and `NetworkInterface.GetAllNetworkInterfaces()` for active network detection (`wifi`, `cellular`, `ethernet`, `none`, `other`). Implements validation bounds (battery 0..100, storage available <= total).
  - `src/Api/FamilyGuardApiClient.cs`: Enforces HTTPS origins, rejects queries/paths/fragments, executes `POST /api/v1/devices/enroll`, `POST /api/v1/agent/heartbeat`, and `POST /api/v1/agent/telemetry` over TLS 1.2 with 10s timeouts.
  - `src/Agent/AgentDaemon.cs`: Background timer scheduler executing periodic heartbeat and telemetry checks every 15 minutes, with immediate check-in capability.
  - `src/UI/TrayNotificationContext.cs`: Windows System Tray (`NotifyIcon`) with shield icon, balloon notification on startup ("XennGuard Active Protection is running with your explicit consent. Zero covert tracking."), and context menu ("Status: Active", "Check-in Now", "Device Details", "Remove Enrollment", "Exit").
  - `src/Program.cs`: Comprehensive CLI supporting `--tray`, `--daemon`, `--enroll <server> <id> <token> [name]`, `--checkin`, `--status`, `--clear`, and `--pubkey`.
- **Windows Automated Test Suite & Compilation**:
  - Build script: `powershell -File C:\laragon\www\FamilyGuard\apps\windows-agent\build.ps1`
  - Compilation: Uses host native `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe` (version 4.8.9221.0). Clean build producing `bin/XennGuardAgent.exe` (36,352 bytes) and `bin/XennGuardAgentTests.exe` (39,424 bytes).
  - Test runner execution: `powershell -File C:\laragon\www\FamilyGuard\apps\windows-agent\run-tests.ps1`
  - Test output: 47 assertions executed across `CryptoTests`, `TelemetryTests`, and `ApiClientTests`. 47 passed, 0 failed in 0.13s.
  - Cross-runtime OpenSSL verification: PHP `openssl_pkey_get_public` and `openssl_verify` verified the Windows agent's exported RSA-2048 public key and `SHA256withRSA` signature with return value `1` (valid).

### Zero-Emoji Policy
- Both `apps/android` and `apps/windows-agent` were scanned via regex `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]`. Zero emojis exist in code, logs, UI, notifications, menus, or unit test descriptions.

---

## 2. Logic Chain

1. **Premise**: Requirement R4 mandates secure device agents for Android and Windows featuring hardware Keystore/DPAPI credential storage, automated periodic heartbeats, complete telemetry reporting, zero covert tracking via visible active indicators, and automated tests.
2. **Android Implementation Logic**:
   - WorkManager (`androidx.work:work-runtime-ktx`) provides battery-efficient, system-managed background execution adhering to modern Android background restrictions.
   - `TelemetryWorker` runs every 15 minutes with `NetworkType.CONNECTED` constraint, ensuring heartbeats and telemetry are delivered whenever connectivity exists.
   - To satisfy the R1 zero-covert-tracking mandate, `ZeroCovertNotificationService` maintains an ongoing, non-dismissible notification in the status shade whenever protection is active, explicitly informing the device owner that health monitoring is occurring with their permission.
   - The consent checklist requires 3 explicit affirmative confirmations (ownership, telemetry, visible notification) before enrollment can proceed, preventing unauthorized or accidental installation.
   - All 16 Android unit tests pass cleanly, and Gradle `assembleDebug` generates `app-debug.apk` without errors.
3. **Windows Implementation Logic**:
   - The Windows agent was implemented in C# targeting .NET Framework 4.8, utilizing native Windows host tools (`csc.exe`) without external package dependencies.
   - RSA identity keys are generated in `Microsoft Enhanced RSA and AES Cryptographic Provider` / CNG with 2048-bit keys, exported in SubjectPublicKeyInfo DER format, and signed with `SHA256withRSA`, matching the backend verification in `DeviceEnrollmentController.php:29`.
   - Credentials (bearer tokens and server origin) are protected using Windows DPAPI (`ProtectedData.Protect` with `DataProtectionScope.CurrentUser`), preventing plaintext credential leaks from the filesystem.
   - To guarantee zero covert tracking on Windows, `TrayNotificationContext` places an ongoing icon in the Windows system notification area (tray) and displays a notification upon startup.
   - The standalone test runner executes 47 assertions covering crypto, DPAPI, telemetry validation, and API origins, all passing with exit code 0.
4. **Deduction**: Both Android and Windows device agents satisfy all functional, architectural, cryptographic, and transparency requirements defined in R4 and PROJECT.md.

---

## 3. Caveats

1. **Physical TEE / StrongBox Hardware**: While Android Keystore uses hardware-backed key generation when available on device, local testing was conducted via JVM unit tests without physical Android hardware connected via ADB.
2. **Windows Desktop Battery Reporting**: On desktop workstations without battery hardware, `SystemInformation.PowerStatus.BatteryLifePercent` reports `255` (unknown) or negative values; the agent gracefully handles this by setting `BatteryPercentage = null` and `Charging = true` (AC power), which conforms to the backend's nullable validation rules.
3. **Enrollment Server Toggle**: The backend `config('familyguard.enrollment_enabled')` defaults to `false`. Real live enrollments against the API require the backend configuration to be enabled.

---

## 4. Conclusion

Milestone M3 is complete. Both device agents (`apps/android` and `apps/windows-agent`) are fully implemented, hardened, and verified:
- **Android**: WorkManager periodic sync, ongoing foreground notification service, full telemetry collection (battery, charging, storage, network), refined consent/QR pairing flow, Keystore RSA-2048/AES-GCM crypto, passing 16 JVM unit tests and building `app-debug.apk`.
- **Windows**: Standalone C# .NET 4.8 agent with DPAPI credential encryption, CNG/RSA-2048 signing, automated periodic daemon, visible system tray indicator, passing all 47 automated tests and verified against PHP OpenSSL.
- **Strict Compliance**: 100% compliant with PROJECT.md interface contracts and the strict zero-emoji policy.

---

## 5. Verification Method

To independently verify the implementations:

### 1. Android Agent Build & Unit Tests
```powershell
cd C:\laragon\www\FamilyGuard\apps\android
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebug
```
- Expected Result: `BUILD SUCCESSFUL` for both tasks. 16 tests pass with 0 failures (`app/build/reports/tests/testDebugUnitTest/index.html`). APK exists at `app/build/outputs/apk/debug/app-debug.apk`.

### 2. Windows Agent Compilation & Automated Tests
```powershell
powershell -File C:\laragon\www\FamilyGuard\apps\windows-agent\build.ps1
powershell -File C:\laragon\www\FamilyGuard\apps\windows-agent\run-tests.ps1
```
- Expected Result: Build finishes with exit code 0, creating `bin/XennGuardAgent.exe` and `bin/XennGuardAgentTests.exe`. Test runner outputs 47 passed assertions and exit code 0.

### 3. Windows Agent CLI Status & Telemetry Inspection
```powershell
& 'C:\laragon\www\FamilyGuard\apps\windows-agent\bin\XennGuardAgent.exe' --status
```
- Expected Result: Displays agent status, DPAPI storage configuration, and live hardware telemetry (battery, AC state, storage total/available, active network).

### 4. Cross-Platform OpenSSL Verification
```powershell
cd C:\laragon\www\FamilyGuard\apps\windows-agent
php tests/test_php_verify.php
```
- Expected Result: Outputs `OPENSSL KEY VERIFICATION: SUCCESS!`, `Key type: RSA`, `Bits: 2048`.

### 5. Invalidation Conditions
- Any occurrence of emojis in Android Compose UI, notification channels, Windows system tray, or console outputs invalidates compliance.
- Unencrypted storage of credentials on disk invalidates the security posture.
- Background monitoring without an ongoing user-visible notification indicator invalidates compliance with the zero-covert-tracking mandate.
