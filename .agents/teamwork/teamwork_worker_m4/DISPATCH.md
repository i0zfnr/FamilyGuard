# DISPATCH — Worker M4 (Web Frontend Application & Dashboard)

## Objective
Implement and test the web frontend dashboard in React 19, Vite, and TypeScript (`apps/web`) adhering strictly to the user-approved visual design in `C:\laragon\www\FamilyGuard\design.md`, proofs in `proofs/`, and interface contracts in `PROJECT.md`.

## Scope Boundaries
- Files exclusively owned:
  - `C:\laragon\www\FamilyGuard\apps\web\`
- DO NOT modify `services/api/`, `apps/android/`, or `apps/windows-agent/`. Follow interface contracts in `PROJECT.md`.

## Input Information
- `C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\laragon\www\FamilyGuard\PROJECT.md` (Interface Contracts & Code Layout)
- `C:\laragon\www\FamilyGuard\design.md` (User-approved design tokens, layout hierarchy, optical rules)
- `C:\laragon\www\FamilyGuard\proofs\*.png` (Visual reference proofs)
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_survey_2\handoff.md` (Frontend survey)

## Mandatory Requirements to Fulfill (R3)
1. **Frontend Architecture & Modularization**:
   - Refactor `apps/web/src/` from monolithic `App.tsx` into clean modular structure:
     - `src/components/`: `HeaderPlatter`, `DeviceCard`, `TelemetryChart`, `EnrollmentModal`, `StatusBadge`, `StatPlatter`, `Button`, `Input`.
     - `src/pages/`: `DashboardPage`, `AuthPage`, `DeviceDetailPage`.
     - `src/services/api.ts`: Typed API client covering auth, devices, challenges, telemetry, and revocation.
     - `src/types/`: TypeScript interfaces for devices, challenges, telemetry, users, and audit logs.
2. **Visual Styling & Apple HIG Liquid Glass**:
   - Canvas: Twilight Obsidian `#0B0F19` with ambient depth orbs.
   - Floating chrome platters: `HeaderPlatter` navigation, modal sheet, quick action pills (`--glass-bg: rgba(255,255,255,0.08)`, blur 28px, specular inner rim).
   - Content Layer: Solid `#111827` content cards with 1px `#1F293D` borders. Zero glass-in-glass nesting.
   - Primary buttons: Cobalt `#2563EB` with hover `#1D4ED8`.
   - Responsive layouts: desktop (1440px) down to mobile (390px) matching `proofs/mobile_dashboard.png`.
   - Complete interaction states: `idle`, `hover`, `active`, `focus-visible`, `loading`, `error`, `disabled`. Visible focus rings.
3. **Telemetry History Visualization**:
   - Render time-series battery trend curve (SVG spline with gradient fill), storage allocation gauge, and network connectivity history.
4. **Device Enrollment Flow**:
   - Floating enrollment modal with QR code display, countdown timer, challenge code, and consent agreement checkbox.
5. **Strict Zero-Emoji Enforcement**:
   - Exactly 0 emojis in code, mockups, copy, or UI. Use clean SVG vector icons (Phosphor / Lucide icons).
6. **Automated Frontend Testing**:
   - Install and configure Vitest and React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `jsdom`).
   - Add comprehensive tests: component rendering, state transitions, API mocking, and automated zero-emoji regex check.
   - `npm test` and `npm run build` must pass cleanly with exit code 0.

## Output Requirements
- Write your comprehensive handoff report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m4\handoff.md` detailing: implemented files, test outputs (`npm test`), build output (`npm run build`), zero-emoji scan result, and notify orchestrator via `send_message`.


## 2026-11-08T18:58:11Z
[Message] timestamp=2026-11-08T18:58:11Z sender=76df9ca4-6de5-42db-b81d-d4c8c9f6bf50 priority=MESSAGE_PRIORITY_HIGH content=You are teamwork_worker_m4.
Your working directory is: C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m4
Your caller/parent conversation ID is: 76df9ca4-6de5-42db-b81d-d4c8c9f6bf50

MANDATORY FIRST STEP:
Read C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md, C:\laragon\www\FamilyGuard\PROJECT.md, and C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m4\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
`C:\laragon\www\FamilyGuard\apps\web\`
Do NOT modify files in `services/api/` or `apps/android/`.

YOUR MISSION:
Implement and test the web frontend dashboard in React 19, Vite, and TypeScript (`apps/web`) matching the approved visual design in `C:\laragon\www\FamilyGuard\design.md` and proofs in `proofs/`:
1. Refactor `apps/web/src/` into a clean modular architecture:
   - `src/components/`: `HeaderPlatter`, `DeviceCard`, `TelemetryChart`, `EnrollmentModal`, `StatusBadge`, `StatPlatter`, `Button`, `Input`.
   - `src/pages/`: `DashboardPage`, `AuthPage`, `DeviceDetailPage`.
   - `src/services/api.ts`: Typed API client handling auth, devices, challenges, telemetry, and revocation with CSRF auto-handling.
   - `src/types/`: Complete TypeScript models.
2. Implement Apple HIG Liquid Glass styling strictly conforming to `design.md`:
   - Canvas: Atmospheric Obsidian `#0B0F19` with subtle depth orbs.
   - Floating chrome platters: `HeaderPlatter` navigation, modal sheets (`--glass-bg: rgba(255,255,255,0.08)`, blur 28px, specular rim).
   - Content layer: Solid `#111827` content cards with 1px `#1F293D` borders. Zero nested refractive glass.
   - Primary CTA: Cobalt `#2563EB` with hover `#1D4ED8`.
   - Telemetry history visualization: battery discharge trend curve (SVG spline with area fill), storage partition breakdown bar, and network connectivity history.
   - Enrollment modal with QR code display, 5-minute timer, challenge string, and device-owner consent checkbox.
   - Strict zero-emoji compliance: 100% SVG vector icons (Phosphor / Lucide icons).
   - Complete interaction states: `idle`, `hover`, `active`, `focus-visible`, `loading`, `error`, `disabled`. Visible focus rings.
   - Accessibility fallbacks: `@media (prefers-reduced-transparency: reduce)` (opaque `#0F172A`) and `@media (prefers-reduced-motion: reduce)`.
3. Configure automated frontend test suite:
   - Install/configure Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and jsdom.
   - Add unit tests for components, API integration, and automated zero-emoji regex scanner.
   - Verify `npm test` and `npm run build` both pass cleanly with exit code 0.
4. Write your comprehensive handoff report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m4\handoff.md` and notify your parent via `send_message`.
