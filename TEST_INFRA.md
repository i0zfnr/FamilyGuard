# E2E Test Infra: XennGuard

## Test Philosophy
- Opaque-box, requirement-driven, multi-tier testing. No dependency on implementation internals.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.
- Strict zero-emoji automated verification.
- Cryptographic attestation and security boundary stress testing.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Workload) |
|---|---------|----------------------|:-----------------:|:-----------------:|:----------------------:|:-----------------:|
| F01 | FigCraft Visual Prototypes | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| F02 | Design Tokens (`design.md`) | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| F03 | Visual Review Gate | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| F04 | RSA Key-Possession Proofs | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F05 | Single-Use Challenges | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F06 | Scoped & Revocable Tokens | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F07 | Session & Rate Limiting | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F08 | Audit Trails & Consent | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F09 | Cross-Tenant Policies | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F10 | Telemetry Ingestion API | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F11 | Android Background Sync | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| F12 | Android Active Indicator | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| F13 | Android Keystore & Telemetry | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| F14 | Windows Agent Client | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| F15 | Web Modular Architecture | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F16 | Web Vector Icons / Zero-Emoji | ORIGINAL_REQUEST §R3, R5 | 5 | 5 | ✓ | ✓ |
| F17 | Liquid Glass Chrome & Layout | ORIGINAL_REQUEST §R3, R5 | 5 | 5 | ✓ | ✓ |
| F18 | Telemetry History Charts | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F19 | Accessible Interaction States | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Backend Runner**: `php artisan test` / `vendor/bin/phpunit` in `services/api`
- **Frontend Runner**: `npm test` (Vitest + React Testing Library) in `apps/web`
- **Android Runner**: `gradlew.bat testDebugUnitTest` in `apps/android`
- **Windows Runner**: Standalone test script / suite in `apps/windows-agent`
- **Zero-Emoji Enforcement**: Regex scanner across `apps/web/src`, `design.md`, and all public UI assets.
- **Security & Integrity Penetration**: Replay attack tests, challenge reuse rejection, cross-tenant device access denial, token revocation enforcement.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| S1 | End-to-end device onboarding: Challenge issuance -> Android Keystore key-pair generation -> challenge signing -> verification -> bearer token issuance | F04, F05, F06, F11, F13 | High |
| S2 | Periodic background telemetry sync: WorkManager scheduled job -> battery & network capture -> API ingestion -> database storage | F10, F11, F13 | Medium |
| S3 | Cross-tenant isolation verification: User B attempts to view or revoke User A's device or telemetry -> HTTP 403 Forbidden | F08, F09 | High |
| S4 | Attack resistance verification: Expired challenge redemption attempt -> HTTP 422; replayed token consumption -> HTTP 422; revoked token heartbeat -> HTTP 401 | F05, F06, F07 | High |
| S5 | Web dashboard end-to-end flow: Owner login -> CSRF retrieval -> device card listing -> telemetry history rendering -> device revocation | F06, F07, F09, F10, F15, F17, F18 | High |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature
- Tier 2: ≥5 boundary & corner test cases per feature
- Tier 3: Pairwise combinations across major features
- Tier 4: ≥5 realistic application-level scenarios
