# DISPATCH — Worker M1 (FigCraft Visual Prototype & Design Documentation)

## Objective
Implement Milestone 1: Author `design.md`, assemble all 5 FigCraft batch scripts in `scripts/design/`, generate the prototypes using `figcraft-cli.exe`, and render high-resolution 2x PNG proofs into `proofs/`.

## Scope Boundaries
- Files exclusively owned:
  - `C:\laragon\www\FamilyGuard\design.md`
  - `C:\laragon\www\FamilyGuard\scripts\design\*.json`
  - `C:\laragon\www\FamilyGuard\prototypes\*.figcraft`
  - `C:\laragon\www\FamilyGuard\proofs\*.png`
- DO NOT modify frontend or backend source code (`apps/web`, `services/api`, `apps/android`, `apps/windows-agent`).

## Input Information
- `C:\laragon\www\FamilyGuard\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\laragon\www\FamilyGuard\PROJECT.md`
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_m1_1\handoff.md` (Full `design.md` draft & token specifications)
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_m1_2\handoff.md` (Desktop Auth & Dashboard scripts)
- `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_explorer_m1_3\handoff.md` (Telemetry, Enrollment Modal & Mobile scripts)
- FigCraft CLI: `C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`

## Output Requirements
- Write `C:\laragon\www\FamilyGuard\design.md` with complete design tokens, layout hierarchy, security UX guidelines, optical parameters, WCAG AA contrast verification, and zero-emoji registry.
- Save the 5 verified JSON batch scripts to `scripts/design/`:
  1. `scripts/design/auth_screen.json`
  2. `scripts/design/dashboard_screen.json`
  3. `scripts/design/telemetry_screen.json`
  4. `scripts/design/enrollment_modal.json`
  5. `scripts/design/mobile_dashboard.json`
- Execute `figcraft-cli.exe run` for each script into `prototypes/` and `figcraft-cli.exe render --scale 2` to export 2x PNG proofs into `proofs/`:
  1. `proofs/auth.png`
  2. `proofs/dashboard.png`
  3. `proofs/telemetry.png`
  4. `proofs/enrollment_modal.png`
  5. `proofs/mobile_dashboard.png`
- Verify exit codes, file sizes, zero-emoji compliance, and Apple HIG Liquid Glass optical rules.
- Write your comprehensive completion report to `C:\laragon\www\FamilyGuard\.agents\teamwork\teamwork_worker_m1\handoff.md` and notify the orchestrator via `send_message`.
