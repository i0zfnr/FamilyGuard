# Architecture and implementation checklist

The intended system separates the React dashboard, Laravel API, Android app, Windows agent and shared protocol. The API will own identities, permissions and session grants; agents must authenticate as devices, independently of users. Signaling will exchange authorized WebRTC messages without requiring private IP reachability. TURN deployment, consent, expiration, revocation and audit enforcement must be designed and tested before any remote-control capability is enabled.

- [x] Initialize Laravel and React applications and monorepo directories.
- [x] Add initial user role and device schema migration.
- [ ] Implement authentication, MFA and role/device policies.
- [ ] Implement challenge redemption with atomic single-use enforcement, cryptographic device identity and scoped device credentials. Challenge issuance and revocation are present; enrollment is unavailable.
- [ ] Implement device heartbeat, monitoring and retention.
- [ ] Implement approved session state machine, signaling and WebRTC.
- [ ] Build and test Windows and Android agents on authorized devices.
- [ ] Implement recovery, security audits, deployment and end-to-end tests.

The health endpoint is intentionally public and reveals only process availability. No device or user API exists yet.
