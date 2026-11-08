# Development progress

## Initial foundation

- [x] Inspected empty workspace and detected tools.
- [x] Scaffolded Laravel API and Vite React TypeScript app.
- [x] Added initial users/devices/permissions migration and health endpoint.
- [x] Added an honest development dashboard and architecture checklist.
- [ ] Configure and verify MySQL against a local server.
- [ ] Implement and verify authentication, enrollment and all subsequent phases.

The application is an early scaffold, not a release candidate. No production-ready device enrollment, location, remote sessions, MFA, remote control or Windows agent is implemented. An Android prototype is described below. Real-device testing is required before the requested project can be considered complete.

Environment: PHP 8.4, Composer 2.8, Node 24, Java 17 and Git found. Laragon MySQL distributions and Android SDK platform-tools are present, but MySQL and adb are not on PATH. .NET and Redis were not found; Docker CLI exists but its daemon was unavailable. Tool presence does not verify a running service or functional Android build environment.

## Verification (2026-11-08)

- Laravel dependencies installed; SQLite migrations completed successfully.
- Vite production build and lint passed; npm reported no vulnerabilities.
- MySQL is listening on 127.0.0.1:3306, but credentials and a dedicated database were not configured or tested.
- Composer initially reported eight Symfony advisories; compatible patched Symfony versions were pinned and the installation audit reported no advisories.
- Laravel feature test checks the health response. No end-to-end device workflows have been tested.

## Authentication and device list (2026-11-08)

- Implemented registration, session login/logout and current-user endpoints with CSRF protection, password hashing, session rotation and request throttling. New accounts are device owners; client-supplied roles are ignored.
- Added owner-scoped device listing and detail endpoints and a React account interface. Enrollment remains unavailable; listing does not create devices.
- Added Laravel Sanctum as a dependency; authentication currently uses Laravel's web session guard, not Sanctum token authentication. MFA, administrator privileges, shared-device permissions and account recovery remain unimplemented. Self-registration must be restricted before deployment.
- Verification: 5 backend tests and 22 assertions passed, covering authentication, role assignment and cross-owner device access. Composer audit found no known advisories; frontend build passed. A live request through the Vite proxy obtained a CSRF token and reached the invalid-credentials response; full browser and real-device workflows remain untested.
- Port 8000 was already occupied by a different service, and Windows reserved ports in the usual Vite range. Local verification used API port 9007 and Vite port 6001. MySQL remains unconfigured.

## Enrollment foundation (2026-11-08)

- Added authenticated, rate-limited enrollment challenge creation and owner-only revocation. Secrets are generated with 256 bits of randomness, returned once, stored as SHA-256 hashes, expire after five minutes, and responses are marked no-store.
- The challenge database records expiration, revocation and use timestamps. At this stage there was no redemption endpoint; see the later prototype update below. Challenge creation does not enroll a device.
- SQLite migration succeeded. Backend tests passed: 7 tests, 35 assertions, including challenge authentication, expiry, hash storage and ownership of revocation.

## Device enrollment prototype (2026-11-08)

- Added a disabled-by-default redemption API with RSA key-possession proof, transactional single-use challenge consumption, hashed expiring device credentials, device heartbeat and owner-only revocation. Device credentials cannot authenticate as users.
- The local consent field is a client assertion and is not proof of human consent. Enrollment remains disabled by default pending real device agents with explicit consent and protected key storage. QR pairing, token/key rotation, real device tests, audit events and session termination remain outstanding. See docs/api/enrollment.md.
- SQLite migration ran successfully. Tests exercise the prototype with the gate enabled, including replay, invalid signature, expiration, revocation and heartbeat; a separate test verifies that the gate is disabled by default.

## Device health foundation (2026-11-08)

- Added validated device-token telemetry ingestion and owner-only paginated history for battery, charging, storage and network. Dashboard cards can display the latest report or explicitly say when data has not been reported. Revocation disables credentials and permissions.
- A scheduled pruning command deletes telemetry older than 30 days, but it runs automatically only when Laravel's scheduler is configured and running. There are no device agents to send real telemetry yet, so no real-device health workflow has been verified.
- SQLite migration succeeded. Backend tests cover owner isolation, invalid values, revoked credentials and retention.

Final verification for this increment: 11 backend tests passed with 61 assertions; Composer audit found no advisories; frontend build and lint passed; scheduler lists the daily pruning task.

## Android prototype (2026-11-08)

- Added a Kotlin/Compose debug app with a visible enrollment approval checkbox, Android Keystore RSA signing key and AES-GCM encrypted credential storage. HTTPS is required; manually requested heartbeat and battery/storage reports use device-scoped credentials.
- Added dashboard challenge creation and cancellation. No user or device has been enrolled. Backend enrollment remains disabled by default; the consent assertion is not independently verifiable. No QR scanning, automatic reporting, location, ring, screen sharing or remote control is implemented. Credential expiration/rotation and recovery are outstanding.
- `assembleDebug` built successfully with JDK 17 and Android SDK 36. No Android device was attached; no real-device enrollment, persistence, or telemetry test was possible. Debug APK is not a production release. See docs/android/README.md.

Android validation: `assembleDebug` and two server-address unit tests passed. `lintDebug` passed with dependency-version/deprecation warnings. The Laravel suite passed 11 tests with 61 assertions; the web build and lint passed. No Android hardware was connected.

## Requested pairing experience

The requested flow is for the administrator's phone to scan a short-lived QR code displayed by the grandfather's phone, followed by the grandfather's explicit approval. This reverses the existing administrator-originated prototype and is not implemented. See docs/android/simple-pairing.md. No devices were enrolled.

## Android account sign-in and deployment discovery (2026-11-08)

- Added a native Android account sign-in screen that uses the existing Laravel session and CSRF endpoints over HTTPS, keeps its session in memory, and can retrieve the first page of owner-scoped devices. This does not grant administrator privileges or implement QR scanning, and the account session is not persistent across activity recreation.
- `assembleDebug` and existing Android unit tests passed. The sign-in flow has not been tested against an HTTPS server or on a real phone.
- Ryaze offers Laravel deployments from Git or ZIP. No Git remote, production configuration, provisioned database, or deployment has been configured. The web/API prototype is not production-ready; public registration, MFA, QR pairing, and device safety require further work.
