# Comprehensive Security Architecture & Backend API Survey Report

## 1. Observation

### 1.1 Codebase Map & Component Status
The backend API service is situated in `C:\laragon\www\FamilyGuard\services\api`.

```
services/api/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php (54 lines)
│   │       ├── Controller.php (7 lines)
│   │       ├── DeviceAgentController.php (66 lines)
│   │       ├── DeviceEnrollmentController.php (49 lines)
│   │       └── EnrollmentChallengeController.php (37 lines)
│   ├── Models/
│   │   ├── Device.php (21 lines)
│   │   ├── DeviceTelemetry.php (11 lines)
│   │   ├── DeviceToken.php (12 lines)
│   │   ├── EnrollmentChallenge.php (20 lines)
│   │   └── User.php (33 lines)
│   └── Providers/
│       └── AppServiceProvider.php (25 lines)
├── bootstrap/
│   └── app.php (23 lines)
├── config/
│   ├── familyguard.php (4 lines)
│   ├── auth.php, cache.php, database.php, logging.php, session.php, etc.
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_11_08_000001_add_familyguard_foundation.php
│   │   ├── 2026_11_08_000002_create_enrollment_challenges.php
│   │   ├── 2026_11_08_000003_create_device_credentials.php
│   │   └── 2026_11_08_000004_create_device_telemetry.php
│   └── seeders/DatabaseSeeder.php
├── routes/
│   ├── api.php (12 lines)
│   ├── console.php (13 lines)
│   └── web.php (27 lines)
├── tests/
│   ├── Feature/
│   │   ├── AuthenticationTest.php (45 lines)
│   │   ├── DeviceEnrollmentTest.php (64 lines)
│   │   ├── EnrollmentChallengeTest.php (38 lines)
│   │   ├── ExampleTest.php (19 lines)
│   │   └── TelemetryRetentionTest.php (22 lines)
│   └── Unit/
│       └── ExampleTest.php (18 lines)
├── composer.json (93 lines)
└── phpunit.xml (37 lines)
```

### 1.2 Verbatim Observations & Tool Outputs

#### Test Execution
Command:
```powershell
powershell -NoProfile -Command "Set-Location C:\laragon\www\FamilyGuard\services\api; php vendor/phpunit/phpunit/phpunit"
```
Output:
```json
{"tool":"phpunit","result":"passed","tests":11,"passed":11,"assertions":61,"duration_ms":8445}
```
All 11 tests across Unit and Feature test suites execute successfully with 61 assertions against SQLite `:memory:` database.

#### Framework & Dependencies
In `services/api/composer.json`:
- Lines 9-12: `"php": "^8.3"`, `"laravel/framework": "^13.17"`, `"laravel/sanctum": "^4.3"`, `"laravel/tinker": "^3.0"`
- Lines 13-16: Symfony components pinned to `7.4.23` / `7.4.22`
- When checked via `php artisan --version`, the runtime reports: `Laravel Framework 13.40.0`.

#### Sanctum Integration Status
In `services/api/app/Models/User.php`:
- Lines 13-18:
  ```php
  #[Fillable(['name', 'email', 'password'])]
  #[Hidden(['password', 'remember_token'])]
  class User extends Authenticatable
  {
      use HasFactory, Notifiable;
  ```
  `User` does NOT use `Laravel\Sanctum\HasApiTokens`.
- There is NO `config/sanctum.php`.
- There are NO Sanctum migrations (`personal_access_tokens` table is absent).
- Neither Sanctum guard nor Sanctum personal access tokens are utilized.

#### Routing Division
In `services/api/routes/web.php`:
- Lines 10-13:
  ```php
  Route::get('/api/v1/health', fn () => response()->json(['status' => 'ok']));
  Route::get('/api/v1/csrf', fn (Request $request) => response()->json(['csrf_token' => $request->session()->token()]));
  Route::post('/api/v1/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
  Route::post('/api/v1/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
  ```
- Lines 14-26: `Route::middleware('auth')` protects:
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/devices/enrollment-challenges`
  - `DELETE /api/v1/devices/enrollment-challenges/{challenge}`
  - `GET /api/v1/devices`
  - `GET /api/v1/devices/{device}/telemetry`
  - `POST /api/v1/devices/{device}/revoke`
  - `GET /api/v1/devices/{device}`
- Note: Although these endpoints are prefixed `/api/v1/`, they reside in `routes/web.php` and depend on Laravel's cookie-based session state (`web` middleware group with `StartSession`, `VerifyCsrfToken`, etc.).

In `services/api/routes/api.php`:
- Lines 7-11:
  ```php
  Route::prefix('v1')->group(function () {
      Route::post('/devices/enroll', [DeviceEnrollmentController::class, 'store'])->middleware('throttle:10,1');
      Route::post('/agent/telemetry', [DeviceAgentController::class, 'telemetry'])->middleware('throttle:60,1');
      Route::post('/agent/heartbeat', [DeviceAgentController::class, 'heartbeat'])->middleware('throttle:60,1');
  });
  ```
- Under Laravel's routing configuration in `bootstrap/app.php`, routes in `api.php` automatically receive the `/api` prefix, resulting in `/api/v1/devices/enroll`, `/api/v1/agent/telemetry`, and `/api/v1/agent/heartbeat`.

#### Device Authentication Implementation
In `services/api/app/Http/Controllers/DeviceAgentController.php`:
- Lines 47-53:
  ```php
  private function authenticateDevice(Request $request): ?Device
  {
      $token = $request->bearerToken();
      if (! is_string($token) || ! preg_match('/\A[0-9a-f]{64}\z/', $token)) return null;
      $credential = DeviceToken::query()->where('token_hash', hash('sha256', $token))->whereNull('revoked_at')->where('expires_at', '>', now())->first();
      return $credential ? Device::query()->whereKey($credential->device_id)->where('enrollment_status', 'active')->first() : null;
  }
  ```
  Device authentication is implemented as an ad-hoc private method on `DeviceAgentController`, rather than a reusable Laravel authentication guard, middleware, or policy.

#### Cryptographic Enrollment Proof
In `services/api/app/Http/Controllers/DeviceEnrollmentController.php`:
- Line 16:
  ```php
  if (! config('familyguard.enrollment_enabled')) return response()->json(['message' => 'Device enrollment is not available.'], 503);
  ```
  Enrollment is disabled by default in `config/familyguard.php` (`FAMILYGUARD_ENROLLMENT_ENABLED` env defaults to `false`).
- Lines 26-31:
  ```php
  $key = openssl_pkey_get_public($data['public_key']);
  $details = $key ? openssl_pkey_get_details($key) : false;
  $signature = base64_decode($data['signature'], true);
  if (! $details || $details['type'] !== OPENSSL_KEYTYPE_RSA || $details['bits'] < 2048 || $details['bits'] > 4096 || $signature === false || openssl_verify($data['challenge_id'].':'.$data['challenge_token'], $signature, $key, OPENSSL_ALGO_SHA256) !== 1) {
      return response()->json(['message' => 'Invalid enrollment request.'], 422);
  }
  ```
- Lines 35-44:
  ```php
  $claimed = EnrollmentChallenge::query()->whereKey($data['challenge_id'])
      ->where('token_hash', hash('sha256', $data['challenge_token']))
      ->whereNull('used_at')->whereNull('revoked_at')->where('expires_at', '>', now())
      ->update(['used_at' => now(), 'updated_at' => now()]);
  if ($claimed !== 1) return null;
  $challenge = EnrollmentChallenge::findOrFail($data['challenge_id']);
  $device = Device::create(['owner_id' => $challenge->user_id, 'device_name' => $data['device_name'], 'platform' => $data['platform'], 'public_key' => $data['public_key'], 'enrollment_status' => 'active']);
  DeviceToken::create(['device_id' => $device->id, 'token_hash' => hash('sha256', $secret), 'expires_at' => now()->addDays(30)]);
  ```

#### Missing Architectural Artifacts
Inspection of `services/api/app` revealed:
- `app/Http/Middleware/`: Directory does not exist (0 custom middleware).
- `app/Policies/`: Directory does not exist (0 policies).
- `app/Http/Requests/`: Directory does not exist (validation handled inside controllers).
- Audit Logging: 0 database tables, 0 models, 0 listeners.
- MFA Implementation: `users.mfa_enabled` column exists, but `AuthController::login` performs no MFA check; no TOTP or WebAuthn routes or classes exist.
- Session State Machine: 0 tables, 0 models, 0 signaling endpoints.

---

## 2. Logic Chain

### 2.1 Requirement Gap Analysis (R1 & R2)

#### Requirement R1: Security Architecture, Threat Modeling & Continuous Hardening
1. **RSA Key-Possession Proofs**:
   - *Observation*: Verified in `DeviceEnrollmentController:26-31`. The server validates RSA key bits (2048-4096) and verifies the signature over `$challenge_id . ':' . $challenge_token` with `OPENSSL_ALGO_SHA256`.
   - *Gap*: The signature binds only the challenge identifiers. It does NOT bind `device_name`, `platform`, `client_nonce`, or an agent timestamp. An attacker intercepting an enrollment message can mutate unauthenticated metadata fields without invalidating the cryptographic signature. Key rotation / re-keying is completely absent.
2. **Transactional Single-Use Enrollment Challenges**:
   - *Observation*: Handled via atomic database update (`whereNull('used_at')->update(['used_at' => now()])`) in `DeviceEnrollmentController:35-39`.
   - *Gap*: The pairing architecture is currently reversed (dashboard-originated challenge manually entered on device). The target user experience (described in `docs/android/simple-pairing.md`) requires the target phone to generate an ephemeral challenge / QR code that the dashboard/administrator phone scans, followed by target-side confirmation.
3. **Scoped, Revocable Device Credentials**:
   - *Observation*: `DeviceToken` generates 256 bits of entropy, stores SHA-256 hash at rest, valid for 30 days (`DeviceEnrollmentController:42`). Revocation sets `revoked_at` and transitions device to `'revoked'`.
   - *Gap*: Token scopes/abilities are implicit (hardcoded to `/agent/heartbeat` and `/agent/telemetry`). There is no token renewal/refresh flow prior to 30-day expiration, and no background task purges expired tokens from `device_tokens`.
4. **Session State Machine**:
   - *Observation*: Missing entirely. `ARCHITECTURE.md` item 10 ("Implement approved session state machine, signaling and WebRTC") is unchecked.
   - *Gap*: No state machine model (`idle`, `requested`, `consent_pending`, `active`, `paused`, `terminated`, `expired`), no signaling endpoints for WebRTC offer/answer exchange, and no TURN credential provisioning.
5. **Rate Limiting**:
   - *Observation*: Static Laravel throttle middleware applied on routes (`throttle:5,1`, `throttle:10,1`, `throttle:60,1`).
   - *Gap*: Throttling keys purely on client IP address. Devices behind corporate/residential NAT share a single rate-limit bucket. There is no keyed rate limiting by `device_id` or `token_hash`, and no progressive delay / lockout on failed login attempts.
6. **MFA Readiness**:
   - *Observation*: Column `mfa_enabled` added in migration `2026_11_08_000001_add_familyguard_foundation.php:12`.
   - *Gap*: `AuthController::login` ignores `mfa_enabled`. No TOTP secret storage, QR generation, challenge verification, recovery codes, or WebAuthn support exist.
7. **Comprehensive Audit Trails**:
   - *Observation*: No audit logging tables or loggers exist anywhere in the application.
   - *Gap*: Critical security events (login success/failure, challenge generation, challenge consumption, device revocation, telemetry anomalies, policy rejections) leave zero audit trail.
8. **Strict Consent Architecture & Zero Covert Tracking**:
   - *Observation*: In `DeviceEnrollmentController:24`, the payload accepts `'owner_approved' => ['required', 'accepted']`.
   - *Gap*: `owner_approved` is an unverified boolean submitted by the client. There is no server-verifiable proof of device-owner physical interaction or OS-level consent indicator verification.

#### Requirement R2: Backend API Services
1. **Sanctum Integration**:
   - *Observation*: Package `laravel/sanctum` installed, but `User` does not import `HasApiTokens`. User auth routes run on session cookies in `routes/web.php`.
   - *Gap*: The API lacks a unified Sanctum SPA / API token architecture.
2. **Device Heartbeats & Telemetry Ingestion**:
   - *Observation*: `POST /api/v1/agent/heartbeat` updates `last_seen_at`. `POST /api/v1/agent/telemetry` validates storage and battery logic, writing to `device_telemetry`. Daily pruning command `familyguard:prune-telemetry` deletes records older than 30 days (`routes/console.php:7-10`).
   - *Gap*: Telemetry requests are unauthenticated with respect to timestamps (server uses `now()`) and lack HMAC or RSA payload signatures; anyone with the bearer token can inject falsified readings. Batch telemetry ingestion for offline agents is missing.
3. **Owner-Scoped Device Management**:
   - *Observation*: Owner scoping enforced via ad-hoc queries:
     `where('owner_id', $request->user()->id)` and `abort_unless($device->owner_id === $request->user()->id, 404)`.
   - *Gap*: Missing Laravel Policies (`DevicePolicy`). No endpoints exist for device unpairing/deletion, device renaming, or managing permissions in `device_permissions`.

---

### 2.2 Threat Modeling & Vulnerability Vectors

| Threat Vector | STRIDE Category | Current Mechanism & Weakness | Risk Level | Proposed Hardening |
|---|---|---|---|---|
| **Replay of Enrollment Challenge** | Repudiation / Tampering | Atomic SQL update `whereNull('used_at')->update(['used_at' => now()])` blocks duplicate challenge reuse. However, signature does not bind client nonce or timestamp. | Medium | Bind client nonce, agent timestamp, and device metadata into RSA signed message. |
| **Telemetry Forgery / Replay** | Tampering | Bearer token verified against SHA-256 hash in `device_tokens`. Once token is acquired, attacker can forge arbitrary battery/storage values. No HMAC/signature on telemetry payload. | High | Include monotonic sequence counter or signature over telemetry payload; validate sane delta bounds. |
| **Cross-Tenant IDOR / Device Takeover** | Information Disclosure / Elevation of Privilege | Handled by inline `$device->owner_id === $request->user()->id` checks. If future endpoints omit this manual check, IDOR occurs. | Medium | Implement standard Laravel `DevicePolicy` and authorize all controller actions with `$this->authorize()`. |
| **Covert Tracking / Simulated Consent** | Elevation of Privilege | `owner_approved: true` is an arbitrary client-supplied JSON field. A malicious agent can set this without user knowledge. | High | Implement device-side visual notification requirement, dual-device pairing handshake (target displays QR, owner scans), and revocable session state machine. |
| **Distributed / NAT DoS on Agent Endpoints** | Denial of Service | `throttle:60,1` keys on client IP. Multiple devices behind NAT collide. Botnets can exhaust IP-based limit. | Medium | Implement custom rate limiters keyed on `sha256(token)` for agents and `user_id` for dashboard users. |
| **Credential Stuffing & Brute Force** | Spoofing | `AuthController::login` has `throttle:5,1` per IP, but no account lockout, no progressive delays, and no MFA verification. | High | Implement account-level failed attempt counters, temporary lockout, audit logging of failed logins, and mandatory MFA. |
| **Unauthorized Remote Control / Signaling Abuse** | Elevation of Privilege | No signaling architecture or session state machine exists. If signaling were added without authorization checks, unauthorized screen view or control could occur. | Critical | Enforce strict session grants: `device_sessions` table with ephemeral, cryptographically verified tokens and target-device active indicator validation. |

---

## 3. Caveats

1. **Android Client Verification**: The Android Kotlin application under `apps/android` was reviewed only at the documentation level (`docs/android/README.md`, `simple-pairing.md`); native Keystore and hardware execution were not evaluated in this backend survey.
2. **Windows Agent Status**: `apps/windows-agent` is currently an empty directory containing only a `.gitkeep` file. No agent code exists for Windows.
3. **Database Engine**: Automated tests run against SQLite `:memory:`. In production, MySQL 8.x is specified by `DEVELOPMENT_PROGRESS.md` but was unconfigured during this inspection. Database concurrency characteristics (e.g. transaction isolation levels) may behave differently between SQLite and MySQL.
4. **Read-Only Constraint**: No source code modifications or package installations were performed during this survey.

---

## 4. Conclusion

The backend API currently provides a working proof-of-concept foundation with 11 passing tests. The cryptographic single-use challenge consumption in `DeviceEnrollmentController` is well-implemented against race conditions, and password hashing and CSRF protections are present.

However, significant architectural gaps exist against Requirements R1 and R2:
- Laravel Sanctum is installed but entirely unused; user auth runs on cookie sessions in `routes/web.php` while device auth runs on inline custom queries.
- MFA, Audit Trails, and the Session State Machine are completely missing.
- Device authorization relies on fragile inline checks rather than Laravel Policies.
- The enrollment flow is inverted compared to the desired simple phone-to-phone pairing specification and lacks device-side verifiable consent.

### Recommended Milestone Decomposition for Backend & Security

```
Backend & Security Hardening Roadmap
├── Milestone B1: Security Infrastructure & Policy Foundation
│   ├── B1.1: Sanctum Integration & Unified API Routing Architecture
│   ├── B1.2: Custom Device Authentication Guard & Middleware (auth:device)
│   ├── B1.3: Laravel Policies (DevicePolicy, EnrollmentChallengePolicy)
│   └── B1.4: Immutable Audit Trail Engine (audit_logs migration, model, listeners)
├── Milestone B2: Identity Hardening, MFA & Reverse Pairing Protocol
│   ├── B2.1: Multi-Factor Authentication (TOTP secret, QR, verification, recovery)
│   ├── B2.2: Reverse Phone-to-Phone Pairing (QR challenge generation & redemption)
│   ├── B2.3: Cryptographic Signature Payload Binding (nonce, metadata, public key fingerprint)
│   └── B2.4: Device Token Rotation & Pruning Task
├── Milestone B3: Session State Machine & Signaling Architecture
│   ├── B3.1: Session State Machine (device_sessions table, states, transitions)
│   ├── B3.2: Secure WebRTC Signaling Endpoints (SDP / ICE exchange)
│   ├── B3.3: Ephemeral Coturn REST Credential Generation (HMAC-SHA1)
│   └── B3.4: Active Consent Indicator Status Reporting
├── Milestone B4: Telemetry Hardening & Keyed Rate Limiting
│   ├── B4.1: Batch Telemetry Ingestion Endpoint
│   ├── B4.2: Keyed Rate Limiting (by device token and user ID)
│   └── B4.3: Automated Scheduled Pruning for Expired Challenges, Tokens & Telemetry
└── Milestone B5: Automated Security Audit & Penetration Suite
    ├── B5.1: Anti-Replay & Concurrency Test Suite
    ├── B5.2: Cross-Tenant Isolation & IDOR Test Suite
    ├── B5.3: Malformed Key & Signature Malleability Test Suite
    └── B5.4: Rate Limiting & Lockout Verification
```

---

## 5. Verification Method

To independently verify all findings and test suite readiness:

1. **Verify PHP and Framework Version**:
   ```powershell
   powershell -NoProfile -Command "Set-Location C:\laragon\www\FamilyGuard\services\api; php -v; php artisan --version"
   ```
   *Expected*: PHP 8.4+, Laravel Framework 13.40.0.

2. **Execute Full Backend Test Suite**:
   ```powershell
   powershell -NoProfile -Command "Set-Location C:\laragon\www\FamilyGuard\services\api; php vendor/phpunit/phpunit/phpunit"
   ```
   *Expected*: 11 tests, 11 passed, 61 assertions, 0 failures.

3. **Verify Route Registration**:
   ```powershell
   powershell -NoProfile -Command "Set-Location C:\laragon\www\FamilyGuard\services\api; php artisan route:list"
   ```
   *Expected*: Inspect output confirming that user auth routes are under web middleware and device agent routes are under api middleware.

4. **Verify Sanctum Inactivity**:
   Inspect `C:\laragon\www\FamilyGuard\services\api\app\Models\User.php` lines 13-18. Confirm absence of `HasApiTokens`.

5. **Verify Absence of Audit Logs and Policies**:
   Inspect `C:\laragon\www\FamilyGuard\services\api\app\Policies` and `C:\laragon\www\FamilyGuard\services\api\database\migrations`. Confirm no `audit_logs` migration exists and no `Policies` directory exists.

6. **Invalidation Conditions**:
   This survey is invalidated if any of the following occur:
   - Sanctum migrations and traits are implemented in `services/api`.
   - New database migrations add `audit_logs` or `device_sessions`.
   - Routes in `routes/web.php` are relocated to `routes/api.php` under token guards.
