# FamilyGuard

FamilyGuard is an early development foundation for consent-based family device management. It is **not ready for enrollment, remote control, recovery, or production use**. See [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md) for the implementation checklist and verification.

## Local development

Requirements: PHP 8.3+ with PDO SQLite (or PDO MySQL), Composer, Node.js and npm. In PowerShell:

```powershell
cd services/api
composer install
Copy-Item .env.example .env # only if .env does not already exist
php artisan key:generate # only for a new installation; never replace an existing key
php artisan migrate
php artisan serve --host=127.0.0.1 --port=9007
```

In another terminal:

```powershell
cd apps/web
npm ci
$env:VITE_API_PROXY="http://127.0.0.1:9007"
npm run dev -- --host 127.0.0.1 --port 6001
```

Open the Vite URL printed by npm. The development proxy forwards `/api` to the local PHP server specified by `VITE_API_PROXY` (default port 8000). The API health endpoint reports only that Laravel responds; it does not check database or other services.

The default local database is SQLite so the scaffold can run without a configured MySQL server. For Laragon MySQL, create a dedicated database and set `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in the untracked `services/api/.env`, then run migrations. Do not commit credentials. Existing SQLite and MySQL databases are separate; changing connection does not migrate data.

Run `php artisan test` in `services/api` and `npm run build` in `apps/web`. Android, Windows agent, Redis, Reverb, WebRTC, TURN and deployment are not implemented yet.

The local preview supports account registration, login and an owner-scoped device list. MFA, device enrollment and account recovery are not yet implemented. Self-registration is enabled for local development; do not deploy this configuration publicly.

Telemetry retention: run `php artisan familyguard:prune-telemetry` from `services/api` to delete records older than 30 days. The scheduled daily job requires a continuously running Laravel scheduler (`php artisan schedule:work` locally, or a deployment scheduler invoking `php artisan schedule:run` each minute). A stopped scheduler does not enforce retention automatically.
