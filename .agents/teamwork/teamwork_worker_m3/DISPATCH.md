# DISPATCH — Worker M3 (Device Agents: Android & Windows)

## Objective
Implement and harden secure device agents (`apps/android` in Kotlin/Compose and `apps/windows-agent`) featuring hardware Keystore credential storage, reliable background heartbeats, full telemetry reporting, and active status indicators.

## Scope Boundaries
- Files exclusively owned:
  - `C:\laragon\www\FamilyGuard\apps\android\`
  - `C:\laragon\www\FamilyGuard\apps\windows-agent\`
- DO NOT modify `services/api/` or `apps/web/`. Follow interface contracts in `PROJECT.md`.

## Input Information
- `C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\laragon\www\FamilyGuard\PROJECT.md` (Interface Contracts & Code Layout)
- `C:\laragon\www\FamilyGuard\SECURITY_MODEL.md`
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_survey_3\handoff.md` (Complete survey of Android & Windows agents)

## Mandatory Requirements to Fulfill (R4)
1. **Android Agent (`apps/android`)**:
   - Add WorkManager dependency (`androidx.work:work-runtime-ktx`) to `app/build.gradle.kts`.
   - Add permissions in `AndroidManifest.xml`: `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `ACCESS_NETWORK_STATE`, `RECEIVE_BOOT_COMPLETED`.
   - Implement `TelemetryWorker`: periodic background WorkManager task executing automated heartbeats (`POST /api/v1/agent/heartbeat`) and telemetry reporting (`POST /api/v1/agent/telemetry` with battery %, charging, storage total/available, network type).
   - Implement persistent active status indicator notification (`ZeroCovertNotificationService` / ongoing notification) guaranteeing zero covert tracking and informing device owner whenever telemetry/monitoring is active.
   - Refine enrollment UI with clear consent checklist and QR pairing flow support.
   - Android Keystore RSA-2048 signing and AES-GCM token storage.
   - Expand unit tests in `app/src/test/java/com/familyguard/app/` (verify crypto, telemetry models, server validation).
   - Verify Gradle build and tests: `.\gradlew.bat testDebugUnitTest` and `.\gradlew.bat assembleDebug` must succeed with exit code 0.
2. **Windows Agent (`apps/windows-agent`)**:
   - Implement standalone production Windows agent in `apps/windows-agent/` (using host C# .NET 4.8 `csc.exe` or host Python 3.11 with `win32crypt`/`cryptography`).
   - Secure credential storage using Windows DPAPI / CNG.
   - Automated periodic background heartbeats and system telemetry collection (battery/AC state, drive storage, network status).
   - Visible tray or active notification indicator ensuring zero covert tracking.
   - Automated unit/integration test suite for Windows agent passing cleanly.

## Output Requirements
- Write your comprehensive handoff report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m3\handoff.md` detailing: implemented files, test execution outputs (`gradlew testDebugUnitTest`, Windows agent test runner), APK build status, and notify orchestrator via `send_message`.

## 2026-11-08T18:58:02Z
Received dispatch from 76df9ca4-6de5-42db-b81d-d4c8c9f6bf50:
Implement and harden device agents for Android and Windows per R4.

