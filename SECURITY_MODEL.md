# Security model (initial)

All future access must be authorized on the server and approved by the device owner where required. Never store private keys or plaintext device tokens. Enrollment challenges must be short-lived and single-use; device credentials must be scoped and revocable. MFA is required before unattended access. Screen sharing must use platform consent and indicators. Do not expose the development servers to the Internet.

Threat modeling and implementation for stolen credentials, compromised devices and VPS, signaling abuse, replay, token leakage, lost devices, TURN abuse and denial of service remain outstanding. No remote access security claim can be made yet.
