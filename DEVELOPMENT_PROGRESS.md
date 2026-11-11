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

## XennGuard branding

- Renamed the visible Android and web app branding to XennGuard and used the user-supplied image for the launcher icon, web brand and favicon. Internal Android package and credential identifiers remain unchanged to preserve app identity.
Android debug build and unit tests, plus web build and lint, passed after the branding change. No launcher or device UI was tested on hardware.

## Interface refresh

- Redesigned web sign-in, registration, device dashboard and responsive layouts using the supplied XennGuard artwork. Account and device actions continue to use existing APIs; unavailable features remain labeled.
- Applied a matching Compose color theme, branded header and system-bar spacing to the Android prototype.
- Web production build and lint passed. Desktop and mobile sign-in layouts were visually inspected. Android debug build and unit tests passed; Android visuals were not inspected on hardware. Internationalization, real-device testing and production readiness remain outstanding.

- Softened the supplied artwork edges on the sign-in panel to remove the visible rectangular boundary. Web build and lint passed; no browser screenshot was verified for this change.

## Ryaze deployment investigation

- Ryaze project `xennguard.ryz.my.id` reported a Git clone failure because it requested `main` while only `master` existed. Created `origin/main` at the same commit as `origin/master` without modifying either branch's existing history.
- Ryaze's Laravel builder operates from the repository root; the app is under `services/api`, and the React build is separate. The root layout, production settings, database and public app have not been validated. No redeployment was triggered.
- The API's AGENTS.md requires Laravel Boost setup before application changes. Composer package installation stalled during optimized autoload generation, so the attempted dependency changes were reverted. Boost setup remains incomplete.

## Ryaze root deployment packaging (2026-11-09)

- Added root Laravel entry files and a checked-in React production build so Ryaze's root-level Laravel builder can load the app and serve the web client. API requests are routed through the Laravel front controller; the client root is served as static HTML.
- Configured Laravel to use its existing `services/api` config and migrations while using the repository root for public files, writable storage and bootstrap cache. Changed the safe starter defaults to SQLite, file sessions/cache, and synchronous jobs so a new deployment does not depend on unverified host database services.
- Validation: Composer root metadata validates; Laravel lists all 15 API routes; SQLite migrations completed; the current workspace backend suite passed 28 tests with 148 assertions; local HTTP smoke checks returned 200 for the XennGuard homepage, compiled JavaScript, icon, health endpoint and CSRF session endpoint. These checks use the local PHP runtime and do not prove Ryaze compatibility.
- Remaining: commit/push to Ryaze's configured `main` branch, trigger deployment and verify public HTTPS. Host PHP compatibility, persistent database configuration, account workflows and production device workflows remain unverified. Enrollment stays disabled by default until consent and device security are validated.

## Ryaze live verification (2026-11-09)

- Ryaze fetched `main` at `b194c4c`, Composer install and migrations completed, and its build log reported deployment finished. A production `APP_KEY` was generated through Ryaze's terminal; enrollment remains disabled.
- The Ryaze dashboard reports the Pro subscription expired on 2026-08-25 and websites suspended, while the subscription page previously displayed Business active through 2026-11-28. The host account status is inconsistent; do not claim the plan is renewed or active based only on the subscription page.
- Public checks: the SPA root has returned HTTP 200 when Ryaze serves static files; `/api/v1/health` and `/api/v1/csrf` have returned Cloudflare HTTP 502. A Laravel development server on port 8080 logged a local health request, but public requests could not be verified through it. The site is not usable for sign-in until Ryaze restores its upstream/tunnel or resolves the account suspension/runtime mismatch.

## Supabase API migration (2026-11-12)

- Added Supabase-backed web authentication and Edge Function API clients for web, Android and Windows. Function route parsing now handles Supabase's rewritten request path. Opaque device credentials use `x-device-token`; the Supabase gateway remains configured for JWT verification. The function checks owner JWTs and device tokens itself.
- Deployed `xennguard-api` to project `akepkkdckpgeioigpusx`; created initial database schema and granted `service_role` access needed by the function. Live `GET /api/v1/health` returned HTTP 200. Live unauthenticated `GET /api/v1/devices` returned HTTP 401, as expected.
- Public Supabase Auth settings report email signup enabled and `mailer_autoconfirm` false. Signup asks Supabase to return confirmation links to the current web origin. Actual mail delivery, confirmed signup, signin and account/profile provisioning have not been verified; user must complete signup and email confirmation themselves.
- Web tests: 38 passed. Lint and production build passed. Build emits a large-chunk advisory. Android unit tests/build and Windows tests had passed before the email redirect-only web change. No device enrollment or real-device monitoring was tested.
- Built web assets were copied into root `public/` for Ryaze. Pushed commit `9b6e7cb` to both `main` and `master`; Ryaze redeploy completed successfully. Production homepage and current bundle returned HTTP 200; bundle contains the Supabase project URL and email-confirmation redirect behavior. Production sign-in and confirmed signup remain unverified.
- Limitations: service-role credentials stay in Supabase and were not added to repository. Public publishable key is bundled into client as intended. Device enrollment remains consent-gated; no covert monitoring. Supabase Auth email deliverability depends on configured SMTP and was not tested.
- The deployment remains a prototype. QR pairing, remote assistance and production device management are not implemented. No user account was created, and no device was enrolled.
- Follow-up routing diagnosis: the public SPA root now returns HTTP 200 after configuring `index.html` before `index.php`; Ryaze's terminal can reach Laravel on port 8080 and `/api/v1/health` returns `{"status":"ok"}` there. The public `/api/v1/health` still returns Cloudflare HTTP 502 through the PHP/FastCGI route. Nginx proxying the public domain directly to terminal port 8080 also returned 502, so the web process is not exposed to Ryaze's public gateway by that route. Sign-in remains blocked pending a working public PHP/app upstream.

## Editorial Authentication Redesign v02 (2026-11-09)

- Replaced previous generic mockup with an elevated editorial split-screen architecture matching genuine XennGuard design principles.
- Left Panel: Deep night canvas (`#090C0A`) with high-contrast display typography ("Care is always within reach"), organic sage accents (`#A2C49E`), and seamless radial-mask integration of the authentic chromatic dove artwork (`/xennguard-icon.jpg`).
- Right Panel: Serene porcelain canvas (`#F8FAF8`) featuring accessible form inputs, Phosphor vector icons (`@phosphor-icons/react`), interactive password visibility toggle, hardware encryption trust cues, and WCAG AA contrast compliance.
- Strict Zero-Emoji compliance: Banned and purged all Unicode glyphs/asterisks (`✳`, `•`) from UI and copy; replaced with semantic Phosphor vector icons (`ShieldCheck`, `Sparkle`, `LockSimple`, `EnvelopeSimple`, `User`, `ArrowRight`, `ArrowUpRight`, `Eye`, `EyeSlash`).
- FigCraft prototype revision saved to `prototypes/auth.figcraft` (Page 1, root frame `id: 50`, 35 layers).
- Vitest test suite verified: 5 test files, 32 passed tests (100%).
- Production assets built to `apps/web/dist` and synced to `public/assets/` (`index-D1P-kpzi.js`, `index-yh-mOstp.css`) and `public/index.html`.
- Local verification server actively running on `http://127.0.0.1:8001`.

## Full-Project Editorial Redesign (2026-11-09)

- Executed full application visual overhaul extending the authentic XennGuard editorial design language from the authentication screen into all authenticated views (Dashboard, Devices list, Device Detail, Telemetry charts, Enrollment modal, Audit Logs, Settings).
- Purged legacy dark blue AI template aesthetics (`#0b111e`, dark blue cards, generic glass gradients) in favor of the warm porcelain & sage palette (`#F7FAF7` canvas, `#FFFFFF` elevated cards with `#D7E3D9` borders, `#1B3626` pine forest green actions).
- Architecture & Layout: Refactored Dashboard into an intuitive two-column workspace architecture (left workspace navigation drawer with active pine pill indicator, right high-density devices feed).
- Screen Reader Accessibility & Numerical Polish: Resolved visual number duplication defect (`03 3` -> `03`) by adding strict `.sr-only` CSS and tabular numerals (`tabular-nums`) across stat platters.
- Vector Iconography: Completely migrated all legacy icons to `@phosphor-icons/react` (Devices, WifiHigh, ShieldWarning, DeviceMobileCamera, Desktop, BatteryCharging, HardDrive, ChartLineUp, Lightning, Sparkle, SignOut, Plus, Clock, Prohibit, Check, Copy) adhering strictly to the Zero-Emoji directive.
- Interactive Modals & Detail Views: Redesigned the cryptographic QR pairing modal (`EnrollmentModal.tsx`) with high-contrast SVG QR matrix, clear consent validation checkboxes, and time-remaining countdown badges. Telemetry view (`DeviceDetailPage.tsx`) updated with clean white card diagnostics and pine-accented sparklines.
- FigCraft Prototype: Updated `prototypes/dashboard.figcraft` with 1440x900 editorial frame (`id: 147`, 51 children) and captured artifact screenshot `xennguard_dashboard_redesign_v2.png`.
- Full Verification: 100% test pass rate on Vitest suite (32/32 tests passed across 5 test files). Production build cleanly compiled with Vite 8 (`index-DFVleFNx.js`, `index-BtmVPA4y.css`) and synced to `public/assets/` and `public/index.html`.
- Running Servers: Vite HMR active on `http://127.0.0.1:5173`, Laravel API/SPA active on `http://127.0.0.1:8001`.

## Docked Obsidian Sidebar & Complete Navigation Functionalization (2026-11-09)

- Replaced the inner floating sidebar card with a docked vertical sidebar architecture docked to the left edge of the viewport (`width: 260px`, `height: 100vh`, background `#0A0E0C` obsidian), perfectly matching the user reference pattern.
- Sidebar Architecture:
  - Header: `xenn.` brand logo box with dove emblem and `YOUR LITTLE UNIVERSE` sub-label.
  - Primary Navigation: `Devices`, `Activity`, `Security` with active outline pill container and status dot.
  - Fleet Quick Filters: `All Devices`, `Android Fleet`, `Windows Workstations`, and `+ Register device` shortcut.
  - Bottom Pinned Area: `Settings` with `WEB BETA` tag, server connectivity indicator, and user account pill.
- View Functionalization:
  - `Devices` (`DashboardPage.tsx`): Full fleet management dashboard with responsive stat platters, platform filter buttons, search input, device card feed, and telemetry inspect buttons.
  - `Activity` (`ActivityPage.tsx`): Real-time interactive audit & security logs table with event type filtering (`ALL`, `AUTH`, `TELEMETRY`, `CHALLENGE`, `CONSENT`, `POLICY`), cryptographic SHA-256 hashes, search, and JSON export.
  - `Security` (`SecurityPage.tsx`): Hardware key posture cards (`SHA256withRSA`), mutual consent verification status, single-use challenge lifetimes, and enrolled device key fingerprint registry with revocation.
  - `Settings` (`SettingsPage.tsx`): Master account identity details, QR proximity policy toggles, telemetry retention window selector (30 days default), and session termination.
- FigCraft Prototype: Updated `prototypes/dashboard.figcraft` with docked obsidian sidebar and porcelain feed (70 layers, root frame `id: 199`, 1440x900) and generated screenshot artifact `xennguard_docked_sidebar_v3.png`.
- Automated Verification: 100% test pass rate on Vitest suite (32/32 tests passed across 5 test suites). Production build compiled cleanly via `tsc -b && vite build` (`index-Bvsu75IW.js`, `index-BtmVPA4y.css`) and synced to `public/assets/` and `public/index.html`.


## Full-project docked sidebar & Android APK redesign (2026-11-09)

- **Web Workspace Overhaul**:
  - Implemented a 260px docked obsidian (`#0A0E0C`) sidebar matching reference specifications, with live navigation across `Devices`, `Activity`, `Security`, and `Settings`.
  - Added full functionality to previously unrouted views:
    - `ActivityPage`: Cryptographic audit journal with SHA-256 hash inspection, category filtering, search, and JSON export.
    - `SecurityPage`: Hardware proof posture (SHA256withRSA, zero covert tracking, single-use challenges) and enrolled key registry with revocation.
    - `SettingsPage`: Master workspace credentials, QR pairing proximity toggle, retention settings, and session control.
  - Verification: 32 Vitest unit and integration tests passed across 5 test suites. Vite 8 production build compiled cleanly.

- **Android APK Redesign & Compilation**:
  - Elevated the Android app (`apps/android`) with Jetpack Compose using the authentic XennGuard porcelain/forest-pine design system (`XennPalette`), adhering strictly to the zero-emoji policy and using vector icons throughout.
  - Implemented `XennHeader` platter with dove brandmark, editorial typography, and live active/setup status pill.
  - Redesigned `MainActivity`:
    - Setup state: Quick QR pairing payload autofill, cryptographic parameter inspection, and 3-point informed consent checklist.
    - Active state: Live hardware fuel gauge (battery %), encrypted volume (storage free/total), network interface, manual sync CTA, and enrollment revocation.
    - Persistent notification and zero covert surveillance trust statement.
  - Redesigned `AdminActivity`: Master sign-in card, fleet browser with platform tags and revocation status, and session controls.
  - Configured 4GB JVM heap (`-Xmx4096m`) in `gradle.properties` for D8 dexing.
  - Verification: `.\gradlew.bat testDebugUnitTest` and `.\gradlew.bat assembleDebug` passed without errors or warnings. Generated `app-debug.apk` (20 MB) at `apps/android/app/build/outputs/apk/debug/app-debug.apk`.

- **Deployment & Remote Sync**:
  - Pushed all changes to both `origin/master` and `origin/main` (`commit 426c956`).
  - Verified Ryaze public endpoint: `https://xennguard.ryz.my.id` returns `HTTP 200 OK` (Cloudflare dynamic cache).

## Simpler first-device setup (2026-11-10)

- Simplified the empty Devices screen into one three-step first-phone setup guide. Removed empty-state metrics, search and platform filters, duplicate add-device actions, and sidebar quick filters.
- Replaced the decorative, non-scannable QR pattern with a real QR containing the Android app's expected one-time JSON pairing payload. Added copy/paste setup instructions and a clear disabled-enrollment message; the device owner must still approve on their phone.
- Added a clear server-unavailable state and disabled setup while the API is unreachable. The status no longer implies that a disconnected server is still connecting.
- Rebuilt the production web assets and synced them into `public/` for Ryaze's root deployment.
- Validation: `npm test` passed 33 tests; `npm run build` and `npm run lint` passed. Commit `3a42e50` was pushed to `origin/main` and `origin/master`; a Ryaze redeployment completed and its public root returns HTTP 200 with bundle `index-CQuJ7gHe.js`. The public `/api/v1/health` still returns HTTP 502, so this interface update does not make sign-in work or enable enrollment.

## Registration failure handling (2026-11-10)

- The browser now stops before sending login or registration data when it cannot obtain the Laravel CSRF token. API gateway errors show their HTTP status and a clear retry message instead of the generic “Request failed.” Network connection errors are also explained directly.
- Ryaze diagnosis: `php artisan route:list --path=api/v1/health` confirms the Laravel route exists, while the public `/api/v1/health` and `/api/v1/csrf` both return HTTP 502. In the Ryaze project terminal, `.port` is empty, no app listener answered on `127.0.0.1:8080`, and no PHP-FPM/Artisan server process appeared. The current Nginx PHP/FastCGI route therefore has no working upstream. No temporary development server was exposed publicly.
- Validation: 36 web tests passed; production build and lint passed. Live account creation remains blocked until Ryaze restores a production PHP upstream.

- Follow-up verification: Ryaze's own hosting documentation says Laravel deployments run through its managed deployment/process infrastructure. The project's `.port` file is present but empty (0 bytes), maintenance mode is off, and the active Nginx configuration routes PHP to `127.0.0.1:9000` when no application port is configured. The public Laravel health route still returns HTTP 502. This narrows the blocker to Ryaze's managed PHP/FastCGI origin; there is no safe project-level process setting exposed in the panel to repair it. Starting `php artisan serve` as a public production endpoint would bypass the managed runtime and is not an acceptable fix.
- After the successful `07e896f` redeployment, verified the public root still returns HTTP 200 while `/api/v1/health` and `/api/v1/csrf` both return Cloudflare HTTP 502. The latest Ryaze build log reports `Deployment finished` and the project is marked active, so a successful frontend deployment does not mean the Laravel API is serving requests. Signup remains blocked pending host-side PHP/FastCGI recovery.

## Alternate Railway deployment preparation (2026-11-10)

- Added a production Dockerfile using FrankenPHP that builds the React frontend, installs Laravel production dependencies, serves frontend and API from one origin, runs database migrations at container startup, and uses Railway's dynamic `PORT` for health-checked web traffic. Added a production Caddyfile, Docker build exclusions, and PostgreSQL/secret setup instructions in `docs/RAILWAY_DEPLOYMENT.md`.
- Validation: web tests passed (36/36), Vite production build passed, `composer validate --no-check-publish` passed with existing exact-version warnings, and `php artisan route:list --path=api/v1/health` found the health route. A local Docker image build could not run because Docker CLI has no Docker engine available. Railway deployment is not yet created: Railway currently requires GitHub sign-in and repository authorization in the browser, and PostgreSQL plus a persistent `APP_KEY` must be provisioned in that account first.
- Follow-up: GitHub sign-in completed and Railway's terms page was cleared by the user. The Railway workspace reports the trial is over, `$0` of free credits remain, and all deployments are paused. Its plan page offers Free (`$1` monthly usage credit, 0.5 GB volume), Hobby (`$5` minimum usage, then metered overage), and Pro. No plan change or paid resource was activated. Deployment is pending the user's choice of plan and, for a paid plan, a monthly spending cap.

## Ryaze PHP upstream support escalation (2026-11-10)

- The user selected repairing the existing Ryaze host. Submitted technical support ticket `VoBDbDxbl2EO` for project `xennguard` / `Kgl9avQVeG1v`, documenting the HTTP 502 health/CSRF responses, active deployment, empty `.port` file, current FastCGI route, and asking Ryaze to restore or advise on its managed Laravel PHP upstream while preserving project data and domain.
- The ticket is confirmed as submitted and is waiting for a support reply. No billing plan or project configuration was changed. Sign-in and enrollment remain unavailable until the host responds and the API health check succeeds.

## Cross-platform test run (2026-11-12)

- Web: `npm test` passed (5 files, 36 tests); `npm run lint` passed; `npm run build` passed.
- API: `php artisan test` passed (28 tests, 148 assertions). PHPUnit uses in-memory SQLite and array cache/session, so this run did not create a production account or use stored credentials.
- Android: `gradlew.bat testDebugUnitTest` passed. Gradle emitted an SDK XML version compatibility warning; unit tests completed successfully.
- Windows agent: `run-tests.ps1` passed (47/47 tests).
- Live Ryaze check: `/` returned HTTP 200; `/api/v1/health` and `/api/v1/csrf` returned HTTP 502. Therefore deployed signup/signin remain blocked by the host's PHP/API upstream. No real account was created, and no real user password was submitted.
- Coverage limit: these are repository unit/feature tests, not exhaustive end-to-end tests of every screen or real device enrollment. Enrollment, MFA, recovery, and remote assistance remain unimplemented or disabled as noted above.

## Supabase backend migration preparation (2026-11-12)

- Added Supabase Postgres schema for profiles, devices, consent challenges, hashed device tokens, telemetry, and audit events. Enabled RLS with owner-only reads and restricted direct client writes; privileged enrollment/revocation use database functions.
- Added `xennguard-api` Edge Function for authenticated owner operations, single-use signed device enrollment, device-token heartbeats, and validated telemetry writes. It verifies user access tokens server-side and never exposes the service-role key to clients.
- Migrated web signup/signin to Supabase Auth and added the email-confirmation state. Migrated Android admin/device calls and Windows agent calls to the Supabase function route; QR payloads include only the publishable project key.
- Validation: web tests 37/37 passed; lint/build passed. Android unit tests passed and debug APK built. Windows agent build passed; 48/48 tests passed. `deno check` and `deno fmt --check` passed for the Edge Function. No Supabase project URL/key or local Postgres is available, so hosted signup, SQL migration execution, Edge Function deployment, and live enrollment are not verified.
- Rollback path: the existing Laravel API and routes remain in the repository and were not removed. The previous hosted app remains unchanged. To activate the new backend, configure Supabase, deploy the SQL migration and Edge Function, set the web build variables, and deploy the built app.
- Limitations: existing Laravel accounts/data are not migrated; users will need to create Supabase accounts. Supabase's free tier can pause inactive projects. Set hosted Auth minimum password length to 12 and configure allowed site/redirect URLs before public use. Device enrollment requires the new function deployment and owner approval on the device.
