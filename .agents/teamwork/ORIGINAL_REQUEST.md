# Original User Request

## Initial Request — 2026-11-08T14:33:30Z

Make a teamwork: Planner (architecture, threat modeling, design roadmapping), Coder (API endpoints, security logic, frontend components, FigCraft design generation), Tester (automated tests for Laravel PHPUnit, web Vite/Vitest, Android unit tests, security vulnerability audit and hardening, WCAG AA contrast validation), Reviewer (code review, anti-slop verification, strict zero-emoji enforcement). Build and harden the production platform for XennGuard across security architecture, backend API, web frontend, device agents, and visual design.

Working directory: C:\laragon\www\FamilyGuard
Integrity mode: development

Reference material:
- FigCraft CLI binary: `C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`
- Apple HIG Liquid Glass specifications and anti-slop rules: `APPLE_HIG_LIQUID_GLASS.md`
- Security model and architecture: `SECURITY_MODEL.md`, `ARCHITECTURE.md`

## Requirements

### R1. Security Architecture, Threat Modeling & Continuous Hardening
Enforce cryptographic device identity with RSA key-possession proofs, transactional single-use enrollment challenges, and scoped, revocable device credentials. Implement a session state machine, rate limiting, MFA readiness, anti-replay protections, comprehensive audit trails, and strict consent architecture with zero covert tracking, device-owner pairing approval, and visible active indicators. Actively test and find vulnerabilities across credential lifecycles, authentication flows, and telemetry ingestion to continuously improve security hardening.

### R2. Backend API Services
Implement and harden backend API services in Laravel 11 with Sanctum (`services/api`) covering authentication, device heartbeats, telemetry ingestion, owner-scoped device management, and challenge issuance/redemption. Prevent unauthorized cross-tenant device access, replay attacks, or telemetry tampering.

### R3. Web Frontend Application
Implement the web frontend dashboard in React, Vite, and TypeScript (`apps/web`) with comprehensive device dashboards, telemetry history, account settings, and authentication screens conforming to the approved visual design. Ensure responsive layouts, complete interaction states (idle, hover, active, focus-visible, loading, error, disabled), accessible focus rings, and zero emojis (use semantic vector icons only).

### R4. Device Agents
Implement secure device agents (`apps/android` in Kotlin/Compose and `apps/windows-agent`) featuring secure credential storage in hardware Keystore, reliable device heartbeats, and telemetry reporting.

### R5. FigCraft Visual Prototype Gate & Design Documentation
Adhere to Apple HIG Liquid Glass specifications and anti-slop rules: glass surfaces are strictly reserved for floating chrome and navigation platters hovering over rich backgrounds, while core content cards sit on solid high-contrast surfaces for readability; never nest refractive glass inside refractive glass. Enforce a strict zero-emoji policy across all code, UI mockups, icons, and documentation (vector icons only). Create a visual prototype in FigCraft (`C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`) and export high-resolution PNG proofs for explicit user review: the user will personally evaluate the prototype and decide whether they want Liquid Glass before any final frontend code implementation proceeds. Rewrite `design.md` covering complete design tokens, layout hierarchy, security UX guidelines, and optical material parameters.

## Acceptance Criteria

### Security & Identity
- [ ] Device identity enforces cryptographic RSA key-possession proofs and transactional single-use enrollment challenges.
- [ ] Device credentials are owner-scoped, revocable, and protected against replay attacks.
- [ ] Pairing requires explicit device-owner approval with zero covert tracking and visible active indicators.
- [ ] Session state machine, rate limiting, and audit logging are implemented and verifiable.
- [ ] Threat analysis and vulnerability tests verify resistance against replay, parameter tampering, and credential leak vectors.

### Backend API
- [ ] Laravel 11 / Sanctum endpoints for auth, heartbeats, telemetry ingestion, device management, and challenge issuance/redemption pass all automated tests.
- [ ] Owner scoping prevents cross-tenant device access or unauthorized telemetry ingestion.

### Web Frontend
- [ ] React/Vite dashboard renders device status, telemetry history, account settings, and authentication flows matching the user-approved design.
- [ ] Application builds cleanly and passes all component and integration tests.
- [ ] Zero emojis exist in code, mockups, copy, or UI (vector icons only).

### Device Agents
- [ ] Android agent stores credentials in Android Keystore, sends heartbeats, and reports telemetry.
- [ ] Windows agent securely manages credentials and reports heartbeat/telemetry.

### Visual Design & Prototype Gate
- [ ] FigCraft visual prototype is constructed and high-resolution PNG proofs are rendered.
- [ ] Explicit user review and decision on Liquid Glass styling is obtained prior to final frontend implementation.
- [ ] `design.md` is updated with complete design tokens, layout hierarchies, accessibility guidelines (WCAG AA contrast ≥ 4.5:1 for body text, ≥ 3:1 for graphics), and optical rules.

### Verification & Testing
- [ ] Automated test suites pass cleanly across backend (`composer test` / `php artisan test`), frontend (`pnpm test` / `npm test`), and agents.
- [ ] Automated vulnerability and security audit checks are executed with all discovered flaws remediated.

## Follow-up — 2026-11-08T18:56:04Z

The user has reviewed and explicitly approved the visual prototype: "proceed". Please resume execution and proceed with Phase 3 full-stack implementation across backend API (M2), device agents (M3), and web frontend (M4).
