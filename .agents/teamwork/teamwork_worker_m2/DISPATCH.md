# DISPATCH — Worker M2 (Security Architecture & Backend API Services)

## Objective
Implement and harden backend API services in Laravel 11 / Sanctum (`services/api`) covering cryptographic device identity, single-use enrollment challenges, owner-scoped device credentials, audit logging, cross-tenant isolation policies, rate limiting, and telemetry ingestion.

## Scope Boundaries
- Files exclusively owned:
  - `C:\laragon\www\FamilyGuard\services\api\`
- DO NOT modify `apps/web/`, `apps/android/`, `apps/windows-agent/`, or `design.md`.

## Input Information
- `C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\laragon\www\FamilyGuard\PROJECT.md` (Architecture, Milestones, Interface Contracts, Code Layout)
- `C:\laragon\www\FamilyGuard\SECURITY_MODEL.md`
- `C:\laragon\www\FamilyGuard\ARCHITECTURE.md`
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_survey_1\handoff.md` (Complete survey of `services/api`)

## Mandatory Requirements to Fulfill (R1 & R2)
1. **Cryptographic Identity & Challenges**:
   - Verify RSA 2048-4096 public keys, `SHA256withRSA` signature over `challenge_id:challenge_token`.
   - Single-use transactional enrollment challenge: 5-minute TTL, SHA-256 hashed storage, atomic consumption preventing replay.
   - Set `config('familyguard.enrollment_enabled') => true` by default in `config/familyguard.php`.
2. **Device Credentials & Revocation**:
   - 256-bit opaque bearer device tokens, SHA-256 hashed storage, 30-day expiry.
   - Owner-scoped revocation endpoint `POST /api/v1/devices/{id}/revoke` revoking all associated tokens and recording audit log.
3. **Audit Trails (`audit_logs`)**:
   - Create migration for `audit_logs` table (`user_id`, `device_id`, `event_type`, `ip_address`, `user_agent`, `payload`, `created_at`).
   - Log all events: auth login/register, challenge issued, device enrolled, token revoked, telemetry received.
4. **Policies & Cross-Tenant Isolation**:
   - Implement `DevicePolicy` enforcing that users can only view, manage, or retrieve telemetry for their own devices (`403 Forbidden` on cross-tenant access).
5. **Rate Limiting & Authentication**:
   - Sanctum token / session alignment; rate limit authentication endpoints and challenge issuance keyed by IP and user identity.
6. **Telemetry Ingestion**:
   - Ingest `battery_percentage`, `charging`, `storage_total`, `storage_available`, `network_type`.
   - Endpoint `GET /api/v1/devices/{device}/telemetry` returning paginated/limited history for owner.
7. **Automated Backend Tests**:
   - Run `php artisan test` / `phpunit`. All existing 11 tests plus comprehensive new tests (challenge replay rejection, cross-tenant isolation, revocation, telemetry ingestion, audit logs) must pass cleanly with 100% success.

## Output Requirements
- Write your comprehensive handoff report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m2\handoff.md` detailing: implemented files, test execution outputs (`php artisan test`), security verification, and notify orchestrator via `send_message`.


## 2026-11-08T18:57:53Z
You are teamwork_worker_m2.
Your working directory is: C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m2
Your caller/parent conversation ID is: 76df9ca4-6de5-42db-b81d-d4c8c9f6bf50

MANDATORY FIRST STEP:
Read C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md, C:\laragon\www\FamilyGuard\PROJECT.md, and C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m2\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
`C:\laragon\www\FamilyGuard\services\api\`
Do NOT modify any files outside `services/api/`.

YOUR MISSION:
Implement and harden backend API services in Laravel 11 / Sanctum per R1 & R2:
1. Verify RSA public key proofs and SHA256withRSA signature verification over `challenge_id:challenge_token` in `DeviceEnrollmentController.php`.
2. Ensure single-use transactional enrollment challenges with 5-minute TTL, SHA-256 hashed storage, and atomic replay prevention.
3. Enable enrollment by setting `config('familyguard.enrollment_enabled') => true` in `config/familyguard.php`.
4. Implement scoped & revocable 256-bit bearer device tokens with SHA-256 hashed storage, and owner-scoped revocation endpoint `POST /api/v1/devices/{id}/revoke`.
5. Create migration and model for immutable `audit_logs` table. Instrument all auth, enrollment, revocation, and telemetry operations to log audit entries.
6. Implement `DevicePolicy` and register it to enforce strict cross-tenant isolation (prevent users from viewing or modifying devices/telemetry belonging to other users; return 403 Forbidden).
7. Implement rate limiting keyed on IP and client identity; align Sanctum / session auth; handle CSRF tokens.
8. Ingest telemetry (`battery_percentage`, `charging`, `storage_total`, `storage_available`, `network_type`) and provide `GET /api/v1/devices/{device}/telemetry` endpoint with owner scoping.
9. Write and run comprehensive automated tests: `php artisan test`. All existing and new security, policy, and enrollment tests must pass with 100% success.
10. Write your comprehensive handoff report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m2\handoff.md` and notify your parent via `send_message`.
