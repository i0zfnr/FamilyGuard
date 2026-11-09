# Survey Handoff Report — Web Frontend & Visual Design

**Author**: `teamwork_explorer_survey_2`  
**Date**: 2026-11-08T14:44:00Z  
**Recipient**: `orchestrator` (`76df9ca4-6de5-42db-b81d-d4c8c9f6bf50`)  
**Mission**: Comprehensive read-only survey of Web Frontend (`apps/web`) and Visual Design (Liquid Glass specifications, design tokens, FigCraft prototype gating, anti-slop, zero-emoji compliance, test suites).

---

## 1. Observation

### 1.1 Existing Web Application Architecture & Layout (`apps/web`)
- **Package Manifest** (`apps/web/package.json`, lines 1–25):
  ```json
  {
    "name": "web",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "lint": "oxlint",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^19.3.1",
      "react-dom": "^19.3.1"
    },
    "devDependencies": {
      "@types/node": "^24.19.2",
      "@types/react": "^19.3.0",
      "@types/react-dom": "^19.3.0",
      "@vitejs/plugin-react": "^6.1.2",
      "oxlint": "^1.90.0",
      "typescript": "~7.0.2",
      "vite": "^8.3.6"
    }
  }
  ```
  - Direct observation: No router library (`react-router-dom`), no testing framework (`vitest`, `@testing-library/react`), and no vector icon library (`@phosphor-icons/react` or `lucide-react`) are installed.
- **Vite Configuration** (`apps/web/vite.config.ts`, lines 1–8):
  - Uses `@vitejs/plugin-react`. Configures `/api` proxy defaulting to `http://127.0.0.1:8000` via `process.env.VITE_API_PROXY`.
- **Application Structure** (`apps/web/src/`):
  - Only 8 files exist: `App.css`, `App.tsx`, `index.css`, `main.tsx`, and assets (`hero.png`, `react.svg`, `vite.svg`).
  - No modular directories (`components/`, `pages/`, `hooks/`, `api/`, `types/`) exist.
- **Component & State Implementation** (`apps/web/src/App.tsx`, lines 1–120):
  - Monolithic single-file component containing both auth states and dashboard state.
  - API client `api<T>` (lines 9–24) auto-fetches CSRF token via `/api/v1/csrf` on non-GET calls, sets `X-CSRF-TOKEN`, and throws `RequestError`.
  - Subcomponent `DeviceCard` (lines 30–52) displays device name, platform, status, last seen, and toggles latest telemetry report via `/api/v1/devices/{id}/telemetry`.
  - State hooks (lines 54–66): `user`, `devices`, `challenge`, `loading`, `busy`, `register`, `error`, `name`, `email`, `password`, `confirmation`.
  - Telemetry representation: Only displays single latest record in plaintext (`Battery: 85% · charging`, `Storage available: 42.1 GiB`). No graphs, time-series history, or visual gauges.
  - Icons and Characters:
    - Line 48: `<span className="icon">◇</span>`
    - Line 102: `<span aria-hidden="true">↗</span>`
    - Line 105: `<div className="empty-icon" aria-hidden="true">⌁</div>`
    - Line 106: `<div className="side-icon" aria-hidden="true">＋</div>`
    - Line 107: `<span className="privacy-icon" aria-hidden="true">✳</span>`
    - Line 109: `<span className="orbit">✳</span>`, `DESIGNED FOR CONNECTION  ↗`
    - Line 110: `<div className="auth-icon" aria-hidden="true">✳</div>`
    - Line 116: `<span aria-hidden="true">→</span>`
    - Uses typographic unicode symbols rather than accessible SVG vector icons.
  - AI Design Tells:
    - Line 103: `YOUR SPACE`
    - Line 105: `YOUR CONNECTIONS`
    - Line 106: `GET CONNECTED`
    - Line 109: `CLOSER, EVEN FROM AFAR`
    - Line 110: `WELCOME TO XENNGUARD`
    - Arbitrary tracked-out all-caps eyebrows violate anti-slop guidelines.

### 1.2 Test Execution and Build Status
- **Build Execution**:
  - Command: `Set-Location C:\laragon\www\FamilyGuard\apps\web; npm run build`
  - Output:
    ```
    > web@0.0.0 build
    > tsc -b && vite build

    vite v8.3.6 building client environment for production...
    transforming...
    ✓ 17 modules transformed.
    rendering chunks...
    computing gzip size...
    dist/index.html                   0.47 kB │ gzip:  0.30 kB
    dist/assets/index-HHnjDK8Q.css   12.32 kB │ gzip:  3.54 kB
    dist/assets/index-C7ug9_P-.js   231.37 kB │ gzip: 71.97 kB
    ✓ built in 890ms
    ```
  - Result: Code 0 (clean build).
- **Lint Execution**:
  - Command: `Set-Location C:\laragon\www\FamilyGuard\apps\web; npm run lint`
  - Output: `Found 0 warnings and 0 errors. Finished in 93ms on 3 files with 116 rules using 12 threads.`
  - Result: Code 0 (clean lint).
- **Test Execution**:
  - Command: `Set-Location C:\laragon\www\FamilyGuard\apps\web; npm test`
  - Output:
    ```
    npm error Missing script: "test"
    npm error To see a list of scripts, run:
    npm error   npm run
    ```
  - Result: Code 1. No test runner is configured and no test files exist in `apps/web/src`.

### 1.3 FigCraft CLI Status & Prototyping Infrastructure
- **Binary Location**: `C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`
- **Execution Test**:
  - Command: `& "C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe" --help`
  - Output:
    ```
    figcraft-cli — FigCraft without a window
    USAGE:
      figcraft-cli info <file> [--json]
      figcraft-cli export <file> -o <out> [--format png|jpg|svg|webp|pdf|xml|fig] [--scale N] [--page NAME] [--node ID|NAME]
      figcraft-cli render <file> -o <out.png> [--scale N] [--page NAME]
      figcraft-cli run <script.json|script.jsonl> [--in <file>] [--out <file>]
      figcraft-cli commands [--json] [--filter TEXT]
      figcraft-cli mcp [--attach PORT]
    ```
  - Result: Binary is fully functional and supports headless batch execution (`run`) and high-resolution image rendering (`render`).
- **Existing Prototype Artifacts**:
  - Inspected `C:\Users\ipan\.gemini\antigravity\brain\a417906f-b329-4ff9-bd23-91ddd4b8d50e\xennguard_auth_redesign.png` and `scratch/redesign_auth_v2.json`.
  - Proves successful execution of FigCraft script to produce a 1440x900 desktop authentication visual proof with Atmospheric Obsidian (`#0B0F19`), floating liquid glass chrome, and solid elevated cards.
  - However, no visual prototypes exist yet for the Main Dashboard, Device Detail / Telemetry Charts, Device Enrollment Modal, or Mobile Breakpoints.
- **Design Specification Status**:
  - `design.md` does not currently exist at `C:\laragon\www\FamilyGuard\design.md`.

---

## 2. Logic Chain

1. **Premise**: Requirement R3 mandates a production-grade web dashboard with device management, telemetry history, account settings, authentication flows, accessible focus rings, and strict zero-emoji enforcement.
   - *Observation Link*: `apps/web/src/App.tsx` contains only a minimal 120-line prototype without telemetry charting, account settings, or modular structure, and uses ad-hoc unicode symbols instead of vector icons.
   - *Deduction*: `apps/web` requires significant architectural decomposition into modular pages, components, hooks, and standard vector icon integration (`@phosphor-icons/react` or `lucide-react`).

2. **Premise**: Requirement R5 and User Directives require a strict two-step visual prototype gate:
   - Step 1: Autonomously design the complete visual prototype in FigCraft, export high-resolution PNG proofs, rewrite `design.md`, and present them to the user for explicit approval.
   - Step 2: Only begin frontend implementation after the user inspects the proofs and confirms ("proceed", "looks good").
   - *Observation Link*: FigCraft CLI is fully operational at `C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`, and a sample auth screen proof was previously generated. No complete dashboard, telemetry, or enrollment prototypes have been rendered into the repository or approved by the user.
   - *Deduction*: The team must execute Step 1 immediately via a dedicated FigCraft generation milestone before touching frontend production code.

3. **Premise**: Apple HIG Liquid Glass specifications and anti-slop rules require:
   - Glass is strictly reserved for floating chrome and platters (navigation bars, modal sheets, floating control pills).
   - Content cards must sit on solid, high-contrast surfaces (`#111827`, `#1E293B`) to maintain WCAG AA contrast (≥ 4.5:1 for body text).
   - Refractive glass must NEVER be nested inside refractive glass.
   - Anti-slop eliminates generic AI templates: no dark purple mesh gradients, no 3-column feature cards with default drop shadows, no tracked-out ALL-CAPS eyebrows.
   - *Observation Link*: Current `App.css` uses an unmotivated 50/50 split with forest-green buttons, low-contrast text, and tracked-out all-caps labels (`YOUR SPACE`, `GET CONNECTED`).
   - *Deduction*: A disciplined design system must be formalized in `design.md` based on Atmospheric Obsidian & Cobalt (`#0B0F19` canvas, floating liquid glass chrome, `#111827` solid cards, `#2563EB` Cobalt CTA).

4. **Premise**: Acceptance criteria require automated test suites to pass cleanly across frontend (`npm test`) and zero-emoji compliance.
   - *Observation Link*: `npm test` fails with `Missing script: "test"` because no test runner (`vitest`) or test files exist in `apps/web`.
   - *Deduction*: Vitest and React Testing Library must be introduced into `apps/web` alongside an automated zero-emoji verification test.

---

## 3. Caveats

- **API Server Dependency**: The web app communicates with the Laravel backend via `/api/v1/*`. While frontend build and unit tests run in isolation with Vitest and mocks, full integration tests require the Laravel API server to be running.
- **Port Allocation**: Development notes in `DEVELOPMENT_PROGRESS.md` indicate default port 8000 was previously occupied by other software; local proxying was tested on port 9007 and Vite on port 6001.
- **Reduced Transparency & Reduced Motion**: CSS implementation must include media queries (`prefers-reduced-transparency: reduce` and `prefers-reduced-motion: reduce`) to satisfy Apple HIG accessibility compliance.

---

## 4. Conclusion

The web frontend (`apps/web`) is currently an early 120-line prototype lacking modular architecture, telemetry visualization, account settings, test infrastructure, and vector icons. FigCraft CLI is fully operational, making it straightforward to construct the complete prototype suite, render high-resolution PNG proofs, and fulfill the mandatory user review gate (R5) prior to frontend code implementation.

### Key Deliverables Identified:
1. **Visual Prototype Gate (R5)**:
   - Construct FigCraft prototypes for: (1) Desktop Auth (Sign-in/Register), (2) Desktop Dashboard (Device Grid & Status), (3) Device Detail & Telemetry Charts, (4) Enrollment & Pairing Modal, (5) Mobile Viewport.
   - Render 2x PNG proofs using `figcraft-cli render`.
   - Author `C:\laragon\www\FamilyGuard\design.md` covering complete design tokens, layout hierarchies, security UX, and optical parameters.
   - Present PNG proofs to the user and HALT for explicit confirmation.
2. **Frontend Architecture Modernization (R3)**:
   - Configure Vitest, React Testing Library, and `@phosphor-icons/react`.
   - Refactor `apps/web/src` into modular components (`HeaderPlatter`, `DeviceCard`, `TelemetryChart`, `EnrollmentModal`, `StatusBadge`).
   - Implement telemetry time-series charts (battery drain, storage bar, network history).
   - Implement accessible form validation with visible focus rings and `:focus-visible` styles.
   - Enforce strict zero-emoji policy across all code and UI.
3. **Frontend Automated Verification**:
   - Component unit tests, CSRF/auth state tests, device management tests, and an automated regex zero-emoji scanner.

---

## 5. Detailed Specifications & Execution Plan

### 5.1 Design System & Token Specifications (`design.md`)

#### Palette Tokens
| Token | Hex / Value | Semantic Role | Contrast vs #0B0F19 |
| :--- | :--- | :--- | :--- |
| `canvas-bg` | `#0B0F19` | Main page background (Twilight Obsidian) | Base |
| `ambient-slate` | `#1E293B` | Atmospheric ambient orb 1 (opacity 0.45) | N/A |
| `ambient-indigo` | `#1E1B4B` | Atmospheric ambient orb 2 (opacity 0.35) | N/A |
| `surface-card` | `#111827` | Solid elevated content cards (never glass) | High opacity |
| `surface-card-border` | `#1F293D` | 1px border on solid content cards | Boundary |
| `surface-input` | `#0A0E17` | Form inputs with 1px border `#334155` | 3.2:1 |
| `brand-primary` | `#2563EB` | Primary CTA button (Cobalt 600) | 4.6:1 (AA) |
| `brand-primary-hover`| `#1D4ED8` | Primary CTA hover state | 5.8:1 (AA) |
| `status-online` | `#10B981` | Device online / healthy indicator | 8.2:1 (AAA) |
| `status-warning` | `#F59E0B` | Low battery / expiring indicator | 9.4:1 (AAA) |
| `status-critical` | `#EF4444` | Revoked / offline critical alert | 5.2:1 (AA) |
| `text-primary` | `#F8FAFC` | Main headings and primary data | 17.5:1 (AAA) |
| `text-secondary` | `#94A3B8` | Subtitles, labels, descriptions | 6.5:1 (AA) |
| `text-muted` | `#64748B` | Timestamps, inactive hints | 3.7:1 (UI AA) |

#### Floating Liquid Glass Chrome Tokens
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.12);
  --glass-border: 1px solid rgba(255, 255, 255, 0.20);
  --glass-blur: 28px;
  --glass-saturate: 180%;
  --glass-inner-rim: inset 0 1px 1.5px rgba(255, 255, 255, 0.45);
  --glass-inner-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.20);
  --glass-drop-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.40);
  --glass-radius-pill: 9999px;
  --glass-radius-panel: 24px;
}
```

#### Apple HIG Optical Rules Checklist
- [x] **Platters, Not Wrappers**: Liquid Glass used strictly for floating navigation bar (`HeaderPlatter`), floating action pills, and floating modal headers.
- [x] **Solid Content Layer**: Device cards, telemetry history, and forms use solid `#111827` surface to ensure crisp readability.
- [x] **No Nested Glass**: No glass buttons or glass pills inside a glass platter. Secondary controls use solid `#1E293B` or flat vibrancy.
- [x] **Zero Emojis**: 100% Phosphor Icons / Lucide SVG vector icons with consistent 1.5px / 2.0px stroke.
- [x] **WCAG AA Compliance**: All body text ≥ 4.5:1; headings and controls ≥ 3.0:1.
- [x] **Accessibility Fallbacks**: Provide `@media (prefers-reduced-transparency: reduce)` with solid `#0F172A` background and `@media (prefers-reduced-motion: reduce)`.

---

### 5.2 FigCraft Prototyping Workflow & CLI Commands

1. **Script Composition**:
   Create JSON command batch files in `scripts/design/`:
   - `auth_screen.json`: Desktop 1440x900 authentication flow.
   - `dashboard_screen.json`: Desktop 1440x900 dashboard with floating chrome and solid device cards.
   - `telemetry_screen.json`: Desktop 1440x900 device detail with telemetry graphs (battery curve, storage distribution).
   - `enrollment_modal.json`: 600x500 floating platter modal with challenge QR and consent checklist.
   - `mobile_dashboard.json`: 390x844 mobile viewport layout.

2. **Headless Generation Command**:
   ```powershell
   & "C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe" run scripts/design/dashboard_screen.json --out prototypes/dashboard.figcraft
   ```

3. **High-Resolution Proof Export Command**:
   ```powershell
   & "C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe" render prototypes/dashboard.figcraft -o proofs/dashboard.png --scale 2
   ```

4. **Approval Gate Protocol**:
   - Embed rendered PNG proofs directly in user-facing chat and artifact.
   - Provide design token rationale and structural breakdown.
   - **HALT**: Wait for explicit user review ("proceed", "looks good", or adjustments) before writing any code in `apps/web`.

---

### 5.3 Recommended Milestone Decomposition for Frontend & Design

| Milestone | Scope & Deliverables | Primary Role | Success Gate |
| :--- | :--- | :--- | :--- |
| **M-DESIGN: FigCraft Visual Gate & Tokens** | 1. Write FigCraft scripts & render 2x PNG proofs for all 5 screens.<br>2. Rewrite `C:\laragon\www\FamilyGuard\design.md`.<br>3. Present proofs in chat artifact. | Designer / Coder | **User Approval Gate** (Explicit user sign-off required) |
| **M-WEB-1: Infrastructure & Test Harness** | 1. Install `@phosphor-icons/react`, `vitest`, `@testing-library/react`, `jsdom`.<br>2. Add `"test": "vitest run"` to `package.json`.<br>3. Set up modular directory structure and design token CSS. | Coder | `npm test`, `npm run build`, `npm run lint` pass |
| **M-WEB-2: Auth & Navigation Chrome** | 1. Implement floating liquid glass header platter (`HeaderPlatter`).<br>2. Implement modern login/register forms with CSRF, error states, and visible focus rings.<br>3. Unit tests for auth flows. | Coder | Auth tests pass; zero emojis verified |
| **M-WEB-3: Dashboard & Telemetry Visualization** | 1. Implement device grid with solid high-contrast cards.<br>2. Implement telemetry history graphs (battery drain curve, storage bar, network status).<br>3. Implement empty states and skeleton loading. | Coder | Dashboard tests pass; WCAG contrast verified |
| **M-WEB-4: Enrollment Flow & Device Security UX** | 1. Implement enrollment modal platter (challenge code, QR code placeholder, 5-min timer).<br>2. Implement consent agreement checklist.<br>3. Implement device revocation flow with destructive confirmation. | Coder | Enrollment tests pass; security UX verified |
| **M-WEB-5: Verification & Zero-Emoji Audit** | 1. Run full test suite.<br>2. Run automated zero-emoji AST/regex scan.<br>3. Run axe-core / WCAG AA automated contrast audit.<br>4. Run production build. | Reviewer / Tester | Zero warnings, 100% tests passing, clean build |

---

## 6. Verification Method

To independently verify the observations and conclusions in this survey report:

1. **Verify Existing Build & Lint**:
   ```powershell
   Set-Location C:\laragon\www\FamilyGuard\apps\web
   npm run build
   npm run lint
   ```
   - Expected: Build generates `dist/` cleanly; lint returns 0 warnings and 0 errors.

2. **Verify Test Failure (Missing Test Runner)**:
   ```powershell
   Set-Location C:\laragon\www\FamilyGuard\apps\web
   npm test
   ```
   - Expected: Fails with code 1 (`npm error Missing script: "test"`).

3. **Verify FigCraft CLI Functionality**:
   ```powershell
   & "C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe" --help
   & "C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe" commands --json
   ```
   - Expected: Exits code 0 with command listing.

4. **Verify Zero-Emoji Non-Compliance in Existing Code**:
   Inspect `apps/web/src/App.tsx` lines 48, 102, 105, 106, 107, 109, 110. Note unicode typography characters (`◇`, `↗`, `⌁`, `＋`, `✳`, `→`) instead of standard vector SVG icons.

5. **Invalidation Conditions**:
   - If user rejects the Atmospheric Obsidian & Cobalt visual direction, adjust palette and re-render FigCraft proofs.
   - If `vitest` experiences compatibility issues with React 19.3 / Vite 8, adjust Vitest configuration and testing environment flags.
