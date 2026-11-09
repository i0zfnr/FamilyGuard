# Project: XennGuard

## Architecture
XennGuard is an enterprise-grade family and device protection platform engineered around cryptographic device identity, mutual consent, transparent active indicators, and high-performance cross-platform agents.

### Core Subsystems & Boundaries
1. **Security & Cryptographic Identity Core**:
   - Hardware-backed RSA key pair generation (2048-4096 bit) on devices (`AndroidKeyStore`, Windows CNG/DPAPI).
   - Transactional, single-use enrollment challenges issued by the backend with 5-minute expiration and SHA-256 hashed storage.
   - Cryptographic key-possession proof via `SHA256withRSA` signature over `challenge_id:challenge_token`.
   - Opaque, revocable, 256-bit bearer device credentials stored with SHA-256 hashing.
   - Comprehensive audit logging (`audit_logs`) tracking authentication, enrollment, revocation, and telemetry events.
   - Strict tenant isolation via Laravel Policies (`DevicePolicy`) and rate limiting keyed to client identity.

2. **Backend API Services (`services/api`)**:
   - Built on Laravel 11 / Sanctum with SQLite / MySQL database.
   - Endpoints for user authentication (`/api/v1/auth/*`), CSRF tokens (`/api/v1/csrf`), health checks (`/api/v1/health`).
   - Device enrollment challenge issuance (`POST /api/v1/devices/enrollment-challenges`) and cryptographic redemption (`POST /api/v1/devices/enroll`).
   - Device agent heartbeat ingestion (`POST /api/v1/agent/heartbeat`) and telemetry reporting (`POST /api/v1/agent/telemetry`).
   - Owner-scoped device management (`GET /api/v1/devices`, `GET /api/v1/devices/{id}/telemetry`, `POST /api/v1/devices/{id}/revoke`).

3. **Web Frontend Dashboard (`apps/web`)**:
   - Built with React 19, Vite, TypeScript, and modern CSS.
   - Apple HIG Liquid Glass visual architecture: floating chrome and navigation platters hover over Atmospheric Obsidian (`#0B0F19`), while content cards sit on solid high-contrast surfaces (`#111827`).
   - Device status cards, telemetry history time-series visualizations (battery curves, storage breakdown, network status).
   - 100% professional vector icons (`@phosphor-icons/react` or `lucide-react`); zero emojis.
   - Comprehensive interaction states (`idle`, `hover`, `active`, `focus-visible`, `loading`, `error`, `disabled`) and WCAG AA contrast.

4. **Device Agents**:
   - **Android Agent (`apps/android`)**: Kotlin + Jetpack Compose. Generates identity keys in `AndroidKeyStore`, signs enrollment challenges, runs periodic background telemetry sync via `WorkManager`, and displays persistent user-visible foreground status notification (`POST_NOTIFICATIONS`).
   - **Windows Agent (`apps/windows-agent`)**: Standalone background service/tray client leveraging DPAPI and Windows Cryptography (CNG/TPM), performing enrollment challenge signing, periodic heartbeats, and telemetry reporting.

5. **Visual Design & Prototyping System**:
   - FigCraft headless CLI (`figcraft-cli.exe`) automating script execution and 2x high-resolution PNG rendering.
   - Design system tokens codified in `design.md`.
   - Explicit user approval gate preceding final frontend production code implementation.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | FigCraft Visual Prototype Suite | Construct JSON scripts and render 2x PNG proofs for Desktop Auth, Dashboard, Telemetry Charts, Enrollment Modal, and Mobile viewports via FigCraft CLI | M1 | R5, Survey 2 |
| F02 | Design System & Token Specifications (`design.md`) | Author complete design tokens (Atmospheric Obsidian, Cobalt CTA, Liquid Glass chrome tokens, solid cards, WCAG AA contrast, optical rules) | M1 | R5, Survey 2 |
| F03 | FigCraft Visual Prototype Approval Gate | Present high-res PNG proofs and structural rationale to user; halt for explicit confirmation on Liquid Glass styling | M1 | R5, AGENTS.md |
| F04 | Cryptographic Device Identity & Key-Possession Proofs | Backend verification of RSA 2048-4096 public keys, SHA256withRSA signature verification over `challenge_id:challenge_token` | M2 | R1, R2, Survey 1 |
| F05 | Transactional Single-Use Enrollment Challenge Protocol | Challenge issuance with 5-minute TTL, SHA-256 hashed storage, atomic consumption preventing replay attacks, runtime toggle | M2 | R1, R2, Survey 1 |
| F06 | Scoped & Revocable Device Credentials | Generation of 256-bit opaque tokens, SHA-256 hashed storage, owner-scoped revocation endpoint (`/api/v1/devices/{id}/revoke`) | M2 | R1, R2, Survey 1 |
| F07 | Session State Machine & Authentication Hardening | Sanctum / session guard alignment, registration/login throttle keyed by user & IP, anti-replay guards, CSRF handling | M2 | R1, R2, Survey 1 |
| F08 | Audit Logging & Consent Enforcement | Immutable `audit_logs` table tracking auth, enrollment, revocation, telemetry; zero covert tracking guarantees | M2 | R1, R2, Survey 1 |
| F09 | Device Management & Cross-Tenant Isolation Policies | Implementation of `DevicePolicy` enforcing owner scoping on device listing, telemetry retrieval, and revocation | M2 | R1, R2, Survey 1 |
| F10 | Telemetry Ingestion & Time-Series History | Ingestion of battery %, charging state, storage total/available, network type; owner-scoped telemetry history retrieval | M2 | R2, Survey 1 |
| F11 | Android Background Sync & WorkManager | Automated periodic heartbeat and telemetry reporting using Android WorkManager | M3 | R4, Survey 3 |
| F12 | Android Active Status Notification & Consent UI | Persistent foreground notification ensuring zero covert tracking; refined consent and pairing flow | M3 | R1, R4, Survey 3 |
| F13 | Android Keystore & Telemetry Enhancement | Capture complete telemetry (charging status, network type); unit test suite for Android client | M3 | R4, Survey 3 |
| F14 | Windows Device Agent Implementation | Standalone Windows agent with DPAPI/CNG crypto, enrollment challenge signing, periodic heartbeats, system telemetry, and active indicator | M3 | R4, Survey 3 |
| F15 | Web Frontend Architecture & Modularization | Refactor `apps/web` into modular components, routes, API clients, and state management; install Vitest/RTL | M4 | R3, Survey 2 |
| F16 | Web Frontend Vector Icon Integration & Zero-Emoji Enforcement | Integrate `@phosphor-icons/react` or `lucide-react`; eliminate all unicode symbols and emojis from code and UI | M4 | R3, R5, Survey 2 |
| F17 | Web Frontend Floating Liquid Glass Chrome & Dashboard | Implement floating navigation platter, solid `#111827` device status cards, and responsive layouts conforming to `design.md` | M4 | R3, R5, Survey 2 |
| F18 | Web Frontend Telemetry Visualization & History Charts | Time-series charts for battery drain, storage utilization bar, and network connectivity history | M4 | R3, Survey 2 |
| F19 | Web Frontend Interaction States & Accessible Forms | Idle, hover, active, focus-visible states, visible focus rings, form error validation, WCAG AA contrast compliance | M4 | R3, R5, Survey 2 |
| F20 | Automated Multi-Tier Test Suites (E2E & Unit) | Full test execution across Backend (PHPUnit), Frontend (Vitest), Android, and Windows agents | M5 | AC, Survey 1, 2, 3 |
| F21 | Security Hardening & Vulnerability Forensics | Automated vulnerability stress tests (replay attacks, cross-tenant isolation, parameter tampering) and clean forensic audit | M5 | R1, AC |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | FigCraft Visual Prototype & Design Gate | Features F01, F02, F03: Create design tokens in `design.md`, batch FigCraft scripts, render 2x PNG proofs, present to user, obtain explicit approval | none | IN_PROGRESS |
| M2 | Security Architecture & Backend API Services | Features F04, F05, F06, F07, F08, F09, F10: Implement and harden Laravel 11/Sanctum backend, RSA proofs, single-use challenges, audit logging, policies, rate limiting, and telemetry API | none | PLANNED |
| M3 | Device Agents (Android & Windows) | Features F11, F12, F13, F14: Android WorkManager, persistent status indicator, full telemetry capture; Windows agent with DPAPI/CNG crypto, heartbeat, and telemetry | M2 (interface contracts) | PLANNED |
| M4 | Web Frontend Application & Dashboard | Features F15, F16, F17, F18, F19: React 19 / Vite modular architecture, vector icons, floating liquid glass chrome, solid cards, telemetry charts, accessible forms | M1 (user approval), M2 | PLANNED |
| M5 | Final Acceptance, E2E Verification & Hardening | Features F20, F21: Pass 100% of automated test suites (backend, frontend, agents), vulnerability penetration tests, zero-emoji verification, clean forensic audit | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Device Enrollment Challenge Issuance
- **Endpoint**: `POST /api/v1/devices/enrollment-challenges`
- **Auth**: User Session / Bearer Token
- **Request Body**: `{}`
- **Response**: `201 Created`
  ```json
  {
    "id": "uuid-v4",
    "token": "64-char-hex-secret",
    "expires_at": "ISO-8601 timestamp"
  }
  ```

### 2. Cryptographic Device Enrollment
- **Endpoint**: `POST /api/v1/devices/enroll`
- **Auth**: Public endpoint (authenticated by challenge signature)
- **Request Body**:
  ```json
  {
    "challenge_id": "uuid-v4",
    "device_name": "string (1-100 chars)",
    "platform": "android" | "windows",
    "public_key": "-----BEGIN PUBLIC KEY-----\nMIIB...-----END PUBLIC KEY-----",
    "signature": "base64-encoded SHA256withRSA signature over (challenge_id:challenge_token)",
    "enrollment_approved": true
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "device_id": 12,
    "device_token": "64-char-opaque-bearer-token",
    "expires_at": "ISO-8601 timestamp (30 days)"
  }
  ```

### 3. Device Agent Heartbeat
- **Endpoint**: `POST /api/v1/agent/heartbeat`
- **Auth**: `Authorization: Bearer <device_token>`
- **Request Body**: `{}`
- **Response**: `200 OK`
  ```json
  {
    "status": "acknowledged",
    "server_time": "ISO-8601 timestamp"
  }
  ```

### 4. Device Telemetry Ingestion
- **Endpoint**: `POST /api/v1/agent/telemetry`
- **Auth**: `Authorization: Bearer <device_token>`
- **Request Body**:
  ```json
  {
    "battery_percentage": 85,
    "charging": true,
    "storage_total": 68719476736,
    "storage_available": 34359738368,
    "network_type": "wifi" | "cellular" | "ethernet" | "none" | "other"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ingested",
    "recorded_at": "ISO-8601 timestamp"
  }
  ```

### 5. Owner Device Telemetry History Retrieval
- **Endpoint**: `GET /api/v1/devices/{device}/telemetry`
- **Auth**: User Session / Bearer Token (validated by `DevicePolicy`)
- **Query Params**: `limit=50`
- **Response**: `200 OK`
  ```json
  {
    "device_id": 12,
    "data": [
      {
        "id": 101,
        "battery_percentage": 85,
        "charging": true,
        "storage_total": 68719476736,
        "storage_available": 34359738368,
        "network_type": "wifi",
        "created_at": "ISO-8601 timestamp"
      }
    ]
  }
  ```

---

## Code Layout
- `services/api/`: Laravel 11 Backend API service
  - `app/Http/Controllers/`: API route controllers
  - `app/Models/`: Eloquent models with fillable casts and relations
  - `app/Policies/`: Authorization policies (`DevicePolicy`)
  - `database/migrations/`: Database schema migrations
  - `routes/api.php` & `routes/web.php`: Route registrations
  - `tests/Feature/` & `tests/Unit/`: PHPUnit test suites
- `apps/web/`: React 19 + Vite + TypeScript Web Frontend
  - `src/components/`: Reusable UI components (`HeaderPlatter`, `DeviceCard`, `TelemetryChart`, `EnrollmentModal`)
  - `src/pages/`: Route page views (`DashboardPage`, `AuthPage`, `DeviceDetailPage`)
  - `src/services/`: API client services
  - `src/tests/`: Vitest and component tests
  - `src/styles/`: CSS tokens, liquid glass utilities, and animations
- `apps/android/`: Android Client (Kotlin / Compose)
  - `app/src/main/java/com/familyguard/app/`: Core application classes, Keystore store, WorkManager worker
  - `app/src/test/java/com/familyguard/app/`: JVM unit test suite
- `apps/windows-agent/`: Windows Client (DPAPI / CNG)
  - `src/`: Windows agent source files, background service, crypto store, heartbeat worker
  - `tests/`: Windows agent automated tests
- `proofs/`: Rendered high-resolution PNG proofs from FigCraft prototypes
- `scripts/design/`: FigCraft JSON batch scripts
- `design.md`: Design system documentation and token references
