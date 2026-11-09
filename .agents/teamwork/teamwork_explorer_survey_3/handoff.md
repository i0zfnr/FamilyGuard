# Device Agents Survey & Technical Assessment Report (Android & Windows)

## Observation

### 1. Repository Inventory and Agent Map
- **Android Agent Directory**: `C:\laragon\www\FamilyGuard\apps\android`
  - Build System: Gradle 8.14.3 wrapper (`gradle/wrapper/gradle-wrapper.properties:3`), Android Gradle Plugin 8.11.1 (`build.gradle.kts:2`), Kotlin 2.2.10 (`build.gradle.kts:3`). Target SDK: 36, Min SDK: 26, Java 17 (`app/build.gradle.kts:8-12`).
  - App Manifest (`app/src/main/AndroidManifest.xml:1-9`): Declares only `android.permission.INTERNET`. Omits `FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, and `ACCESS_NETWORK_STATE`. Sets `allowBackup="false"` and `usesCleartextTraffic="false"`. Contains two activities: `MainActivity` (launcher) and `AdminActivity` (non-exported).
  - Key Storage & Crypto (`app/src/main/java/com/familyguard/app/DeviceStore.kt`):
    - Generates 2048-bit RSA key pair in `AndroidKeyStore` (`identityAlias = "familyguard_identity"`): `PURPOSE_SIGN`, `DIGEST_SHA256`, `SIGNATURE_PADDING_RSA_PKCS1` (`DeviceStore.kt:20-30`).
    - Signs payload with `Signature.getInstance("SHA256withRSA")` (`DeviceStore.kt:32-37`).
    - Generates AES-GCM key in `AndroidKeyStore` (`secretAlias = "familyguard_secret"`) (`DeviceStore.kt:39-45`).
    - Encrypts 32-byte opaque device token via `AES/GCM/NoPadding` and saves ciphertext + base64 IV into private `SharedPreferences("familyguard_device")` (`DeviceStore.kt:46-52`).
  - HTTP Client (`app/src/main/java/com/familyguard/app/FamilyGuardApi.kt`):
    - Uses standard `HttpURLConnection` with strict HTTPS validation (`FamilyGuardApi.kt:8-12`).
    - Issues `POST` requests with 10s timeouts, non-redirecting, `Accept: application/json`, and optional `Authorization: Bearer <token>` (`FamilyGuardApi.kt:13-28`).
  - UI & Interaction (`app/src/main/java/com/familyguard/app/MainActivity.kt` & `AdminActivity.kt`):
    - `MainActivity.kt:51-67`: Manual enrollment UI requiring manual entry of `server`, `challenge_id` (UUID), `challenge_token` (64-char hex), and `device_name`, plus a single checkbox: `"I own or am authorized to manage this device and approve its enrollment."`
    - `MainActivity.kt:70-80`: Manual on-demand button `"Send health report"` calling `POST /api/v1/agent/heartbeat` and `POST /api/v1/agent/telemetry`.
    - `AdminActivity.kt:23-61`: Native session sign-in using cookie-based web session (`/api/v1/csrf` and `/api/v1/auth/login`) and device listing (`/api/v1/devices`).
  - Test Suite (`app/src/test/java/com/familyguard/app/ServerAddressTest.kt`):
    - Contains 2 unit tests verifying `FamilyGuardApi.validateServer()` for HTTPS scheme, host, and unsafe path/query rejections.
    - Zero unit tests exist for `DeviceStore`, `FamilyGuardApi`, `AdminSession`, or Compose UI.
    - Zero instrumented tests (`connectedAndroidTest` / Robolectric) exist.

- **Windows Agent Directory**: `C:\laragon\www\FamilyGuard\apps\windows-agent`
  - File contents: Exclusively a single `.gitkeep` placeholder file (`sizeBytes: 0`).
  - Status: Completely unbuilt (0 source files, 0 build configurations, 0 tests).
  - Backend Reference: `services/api/app/Http/Controllers/DeviceEnrollmentController.php:21` specifies `'platform' => ['required', Rule::in(['android', 'windows'])]`.

- **Host Toolchain & Runtime Observations**:
  - JDK 17: Installed and functional (`assembleDebug` and `testDebugUnitTest` executed with exit code 0).
  - Android SDK 36: Located at `C:\Users\ipan\AppData\Local\Android\Sdk`. `adb.exe devices` returns 0 connected devices.
  - Classic .NET Framework: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe` (version 4.8.9221.0 for C# 5) is installed on host.
  - Windows Crypto Providers: `certutil -csplist` confirms presence of `Microsoft Platform Crypto Provider` (TPM 2.0 hardware KSP), `Microsoft Software Key Storage Provider` (CNG software KSP), and `ProtectedData` (DPAPI).
  - Python: Python 3.11 (`C:\Users\ipan\AppData\Local\Programs\Python\Python311\python.exe`) is installed with `win32crypt` (DPAPI) and `cryptography` libraries installed.
  - Node.js: Node.js 24.19.2 is available at `C:\Program Files\nodejs\node.exe`.
  - Modern .NET SDK (`dotnet`), `rustc`, and `go` are not in the system PATH.

- **Backend Integration Endpoints**:
  - `POST /api/v1/devices/enrollment-challenges` (`EnrollmentChallengeController.php:11-26`): Generates 256-bit random token, stores SHA-256 hash with 5-minute expiry, returns `id` and `token`.
  - `POST /api/v1/devices/enroll` (`DeviceEnrollmentController.php:14-47`): Validates RSA public key (2048-4096 bits), verifies RSA-SHA256 signature against `challenge_id:challenge_token`, atomically consumes challenge, stores PEM public key, generates 256-bit opaque device token (30-day expiry), returns `device_token` with `Cache-Control: no-store`. Gated behind `config('familyguard.enrollment_enabled')` (currently `false` in default configuration, returning HTTP 503).
  - `POST /api/v1/agent/heartbeat` (`DeviceAgentController.php:14-20`): Authenticates via `Bearer <token>` (SHA-256 match in `device_tokens`), updates `last_seen_at`.
  - `POST /api/v1/agent/telemetry` (`DeviceAgentController.php:22-39`): Ingests `battery_percentage` (0-100), `charging` (bool), `storage_total` (int), `storage_available` (int), and `network_type` ('wifi', 'cellular', 'ethernet', 'none', 'other').
  - `POST /api/v1/devices/{device}/revoke` (`DeviceAgentController.php:55-64`): Revokes device tokens and permissions.

### 2. Direct Build and Test Results
- Android unit tests:
  - Command: `cd C:\laragon\www\FamilyGuard\apps\android; .\gradlew.bat testDebugUnitTest`
  - Result: Exit code 0, 22 tasks executed, `ServerAddressTest` passed 2 tests in 53s.
- Android debug compilation:
  - Command: `cd C:\laragon\www\FamilyGuard\apps\android; .\gradlew.bat assembleDebug`
  - Result: Exit code 0, generated `app-debug.apk` (9,176,568 bytes, SHA/LastWrite: 2026-11-08 19:11:47).
- Backend PHPUnit tests:
  - Command: `cd C:\laragon\www\FamilyGuard\services\api; php artisan test`
  - Result: Exit code 0, 11 tests passed, 61 assertions in 3.02s.

---

## Logic Chain

1. **Premise**: Requirement R4 mandates secure device agents (`apps/android` and `apps/windows-agent`) featuring hardware Keystore credential storage, reliable device heartbeats, and telemetry reporting. Requirement R1 mandates cryptographic device identity with RSA key-possession proofs, zero covert tracking, explicit device-owner pairing approval, and visible active indicators.
2. **Analysis of Android Agent (`apps/android`)**:
   - *Hardware Keystore & Identity*: `DeviceStore.kt:20-30` correctly generates an RSA 2048-bit key in `AndroidKeyStore` and signs `challenge_id:challenge_token` with `SHA256withRSA`, matching the backend verification in `DeviceEnrollmentController.php:29`. However, it lacks hardware attestation (`KeyGenParameterSpec.Builder.setAttestationChallenge(...)` is not set), lacks StrongBox validation (`setIsStrongBoxBacked(true)` is not attempted), and does not inspect `KeyInfo.isInsideSecureHardware()`.
   - *Token Storage*: `DeviceStore.kt:39-61` generates an AES-GCM key in `AndroidKeyStore` to encrypt the 30-day device token before storing it in `SharedPreferences`. This protects against cold offline extraction from disk, but lacks biometric gating or master key re-wrapping.
   - *Heartbeat & Background Scheduling*: `MainActivity.kt:70-80` requires the user to open the app and manually tap `"Send health report"`. There is NO background scheduling service, NO `WorkManager` dependency in `app/build.gradle.kts:14-21`, NO `JobScheduler`, and NO Foreground Service. When the app is in the background or killed, zero heartbeats and zero telemetry are sent.
   - *Active Status Indicator & Consent Transparency*: `MainActivity.kt:57` provides an enrollment approval checkbox, but once enrolled, there is NO persistent notification or active status indicator. Under Android 8.0+ (API 26+) and Android 14+ background execution rules, background operations must either run as deferred `WorkManager` tasks or maintain an ongoing Foreground Service with a clear, user-visible notification (`POST_NOTIFICATIONS` permission).
   - *Telemetry Completeness*: `MainActivity.kt:72-78` extracts `battery_percentage` and `storage_total`/`storage_available`, but fails to capture `charging` state and fails to capture `network_type` (both of which are supported by `DeviceAgentController.php:26-32`).
   - *Pairing Friction*: The current prototype requires the user to manually type or paste a 36-character UUID and a 64-character hexadecimal token into text fields. As noted in `docs/android/simple-pairing.md`, this is unusable for elderly users (e.g. grandfather use case) and lacks reverse QR-based pairing.
3. **Analysis of Windows Agent (`apps/windows-agent`)**:
   - `apps/windows-agent` is completely empty (only `.gitkeep`).
   - The backend contract (`DeviceEnrollmentController.php:21`) already accepts `platform => 'windows'`.
   - To satisfy R4 on Windows without installing external third-party SDKs, the project can utilize either:
     - **Option A (C# / .NET)**: Built via `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe` (available natively on host) utilizing `System.Security.Cryptography.CngKey` with `Microsoft Platform Crypto Provider` (TPM 2.0) and fallback to `Microsoft Software Key Storage Provider`, DPAPI (`ProtectedData.Protect`), and compiling into a standalone executable that can run as a Windows Service or tray agent.
     - **Option B (Python)**: Utilizing the existing host Python 3.11 with `win32crypt` (DPAPI) and `cryptography` package, providing rapid scripting, service integration via `win32serviceutil`, and full unit testing.
4. **Analysis of Test Coverage**:
   - Android has 2 trivial test assertions in `ServerAddressTest.kt` verifying URL string sanitation.
   - Zero mock tests exist for Keystore operations, zero tests for network failure modes, zero tests for session handling, and zero UI tests.
   - Windows agent has zero tests.
5. **Deduction**: While the cryptographic primitive alignment (RSA-SHA256, AES-GCM) between Android and the Laravel API is sound, neither agent currently meets the production criteria of R4 (reliable automated heartbeats, full telemetry, hardware attestation, persistent active indicators, and end-to-end Windows agent implementation).

---

## Caveats

1. **Hardware Device Absence**: No physical Android smartphone or running emulator is connected via ADB. All Android verifications rely on host-side Gradle builds (`assembleDebug`), lint, and JVM unit test executions. Keystore operations on physical secure hardware (TEE/StrongBox) cannot be verified on this workstation.
2. **Backend Enrollment Gate**: The Laravel backend configuration `config('familyguard.enrollment_enabled')` defaults to `false`. Live enrollment calls fail with HTTP 503 unless the configuration is explicitly enabled in `.env` or during testing.
3. **Screen Sharing & Remote Control**: The scope of R4 surveyed here covers device identity, Keystore, heartbeats, and health telemetry. Screen sharing, WebRTC, AccessibilityService, and remote control capabilities are explicitly not implemented and are marked as future phases in `ARCHITECTURE.md`.
4. **Windows Toolchain**: Modern .NET 8 SDK (`dotnet`), Rust, and Go are not installed in the PATH. Windows agent development must leverage host-available tools (`csc.exe` .NET Framework 4.8 or Python 3.11).

---

## Conclusion

The Device Agents currently represent an early proof-of-concept for Android and a blank placeholder for Windows.
- **Android Agent**: Strong foundational cryptography (RSA 2048 via `AndroidKeyStore`, AES-GCM credential encryption) and clean Jetpack Compose UI architecture. Major gaps include lack of automated background scheduling (WorkManager), absence of an active status indicator (Foreground Service notification), incomplete telemetry fields, high-friction pairing UX, and minimal test coverage.
- **Windows Agent**: Currently non-existent. A complete implementation is required, covering TPM/CNG cryptographic key generation, DPAPI credential storage, background heartbeat/telemetry reporting, and a visible notification/tray indicator.
- **Backend Compatibility**: The backend schema and endpoints (`/api/v1/devices/enroll`, `/api/v1/agent/heartbeat`, `/api/v1/agent/telemetry`) are well-designed and cryptographically verified, but require reverse pairing coordination (e.g. QR code workflow) to replace manual secret entry.

---

## Recommended Milestone Decomposition for Device Agents

### Milestone DA-1: Android Agent Hardening & Background Telemetry
- **Scope**:
  1. Add `androidx.work:work-runtime-ktx:2.10.0` and `androidx.core:core-ktx` to `apps/android/app/build.gradle.kts`.
  2. Implement `DeviceHeartbeatWorker` extending `CoroutineWorker` scheduled via `PeriodicWorkRequestBuilder` (15-minute interval) with `NetworkType.CONNECTED` constraint.
  3. Implement Foreground Service with persistent notification channel (`"XennGuard Active Protection"`, priority low/min, zero-emoji icon) satisfying R1 active indicator requirements.
  4. Enrich telemetry collector in `TelemetryCollector.kt` to extract:
     - Battery level and `BatteryManager.BATTERY_STATUS_CHARGING` boolean.
     - Internal storage total and available bytes via `StatFs`.
     - Active network transport via `ConnectivityManager.getNetworkCapabilities()` (`wifi`, `cellular`, `ethernet`).
  5. Add `KeyInfo` hardware inspection in `DeviceStore.kt` checking `isInsideSecureHardware()` and adding fallback logging.
  6. Add unit tests using Robolectric / Mockito for `DeviceStore`, `FamilyGuardApi`, and `DeviceHeartbeatWorker`.

### Milestone DA-2: Windows Agent Architecture & Foundation
- **Scope**:
  1. Initialize `apps/windows-agent` project structure:
     - Recommended Stack: C# (.NET Framework 4.8) compiled via native `csc.exe` or standalone C# project structure with MSBuild/NUnit, with optional Python reference implementation.
  2. Implement `WindowsKeyStore`:
     - RSA 2048 key-pair generation using `CngKey.Create()` targeting `Microsoft Platform Crypto Provider` (TPM) with automatic fallback to `Microsoft Software Key Storage Provider`.
     - Sign enrollment challenge `challenge_id:challenge_token` using `RSACng` with `SHA256`.
     - Secure token storage using Windows DPAPI (`ProtectedData.Protect` with `DataProtectionScope.CurrentUser` or `LocalMachine`).
  3. Implement Windows Enrollment CLI/GUI:
     - Accept server URL and challenge credentials.
     - Validate certificate pinning / HTTPS.
     - Submit `POST /api/v1/devices/enroll` with `platform: "windows"`.
     - Persist encrypted token.

### Milestone DA-3: Windows Agent Background Service & Telemetry
- **Scope**:
  1. Implement background daemon/service:
     - Service worker or Windows Task Scheduler job running every 15 minutes.
     - Sends `POST /api/v1/agent/heartbeat`.
  2. Implement telemetry collector for Windows:
     - Battery status via `GetSystemPowerStatus` API (handling desktop AC power gracefully).
     - Disk storage via `DriveInfo.GetDrives()`.
     - Network type via `NetworkInterface.GetAllNetworkInterfaces()`.
     - Sends `POST /api/v1/agent/telemetry`.
  3. Implement transparency & active indicator:
     - System Tray Icon (`NotifyIcon`) displaying agent status: "XennGuard Device Agent - Connected".
     - Context menu with "View Status", "Send Telemetry Now", and "Disconnect / Unenroll".

### Milestone DA-4: Device Pairing UX Modernization
- **Scope**:
  1. Replace manual UUID/token entry with QR code workflow:
     - Grandfather's phone (Android) generates an ephemeral pending pairing session and displays a QR code.
     - Administrator phone or web dashboard scans the QR code.
     - Grandfather's phone receives push notification or polls for incoming link, displaying an explicit approval dialog: "Allow <Administrator Name> to manage this device?"
     - Target device signs the challenge upon explicit approval and completes enrollment.
  2. Add camera scanning dependency (`androidx.camera` or ZXing QR generator/scanner).

### Milestone DA-5: Automated Agent Test Suites & Security Verification
- **Scope**:
  1. Android unit test expansion:
     - Mock server HTTP response testing for `FamilyGuardApi`.
     - Unit tests for JSON telemetry parsing and error responses.
     - Robolectric tests for `DeviceStore` cryptographic lifecycle.
  2. Windows agent automated test suite:
     - Unit tests verifying RSA signature generation against standard OpenSSL verification vectors.
     - DPAPI round-trip encryption/decryption tests.
     - Telemetry collection validation across offline and online scenarios.

---

## Verification Method

### 1. Android Agent Verification
- **Build Cleanliness**:
  ```powershell
  cd C:\laragon\www\FamilyGuard\apps\android
  .\gradlew.bat clean assembleDebug
  ```
  *Expected*: `BUILD SUCCESSFUL`, `app/build/outputs/apk/debug/app-debug.apk` generated.
- **Unit Test Execution**:
  ```powershell
  cd C:\laragon\www\FamilyGuard\apps\android
  .\gradlew.bat testDebugUnitTest --rerun-tasks
  ```
  *Expected*: `BUILD SUCCESSFUL`, all test classes execute cleanly with HTML report at `app/build/reports/tests/testDebugUnitTest/index.html`.
- **Lint Inspection**:
  ```powershell
  cd C:\laragon\www\FamilyGuard\apps\android
  .\gradlew.bat lintDebug
  ```
  *Expected*: Zero fatal errors. Review `app/build/reports/lint-results-debug.html`.

### 2. Windows Agent Verification (Upon Implementation)
- **Compilation Check**:
  ```powershell
  & 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /target:winexe /out:C:\laragon\www\FamilyGuard\apps\windows-agent\XennGuardAgent.exe /reference:System.dll,System.Core.dll,System.Security.dll,System.Net.Http.dll,System.Windows.Forms.dll C:\laragon\www\FamilyGuard\apps\windows-agent\src\*.cs
  ```
  *Expected*: Clean compilation without errors, producing `XennGuardAgent.exe`.
- **Crypto & Signing Verification**:
  - Test harness generating RSA-2048 key in TPM/Software KSP, signing test vector `test_uuid:test_token`, and verifying signature with OpenSSL CLI or PHP `openssl_verify`.

### 3. Backend Integration Verification
- **PHPUnit Device & Agent Tests**:
  ```powershell
  cd C:\laragon\www\FamilyGuard\services\api
  php artisan test tests/Feature/DeviceEnrollmentTest.php tests/Feature/EnrollmentChallengeTest.php tests/Feature/TelemetryRetentionTest.php
  ```
  *Expected*: All tests pass with 0 failures.

### 4. Invalidation Conditions
- Any introduction of emojis in Android Compose UI, notification channels, Windows system tray, or console output invalidates compliance with the project's strict zero-emoji policy.
- Storing unencrypted device tokens in Android `SharedPreferences` or Windows plaintext config files invalidates the cryptographic security posture.
- Executing background monitoring without an ongoing, visible notification indicator on Android invalidates compliance with the zero-covert-tracking mandate.
