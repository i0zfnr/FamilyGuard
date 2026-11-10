# Railway deployment

This repository can run the React workspace and Laravel API together in one Railway web service. The Docker build compiles the web app, serves it and the API from one HTTPS origin with FrankenPHP, and runs Laravel migrations when the service starts.

## Create the Railway services

1. Create a Railway project and add a PostgreSQL service.
2. Add a service from the `i0zfnr/FamilyGuard` GitHub repository, using the `main` branch and the repository root as its build context. Railway detects the root `Dockerfile`.
3. Generate an `APP_KEY` for this new deployment with `php artisan key:generate --show` in a trusted local PHP environment. Save that value as a Railway service variable. Do not commit it or reuse a key from another environment.
4. Set these variables on the application service:

   ```text
   APP_NAME=XennGuard
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=<new generated key>
   APP_URL=https://<the Railway service domain>
   SESSION_SECURE_COOKIE=true
   DB_CONNECTION=pgsql
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   Replace `Postgres` in the variable references with the exact name of the PostgreSQL service in Railway. Set the Railway-generated public domain as `APP_URL`.

5. Wait for the deployment to become healthy, then verify `/api/v1/health` returns `{"status":"ok"}` and that the website root loads. Only then create the master account.

The migration runs on service startup. Do not deploy with an empty `APP_KEY`, `APP_DEBUG=true`, or SQLite on an ephemeral filesystem. Keep the current Ryaze deployment until the new URL and account flow have been verified. The existing Ryaze subdomain will not automatically point to Railway; Ryaze must allow a custom DNS target for that subdomain, or users will need the Railway domain.

## Local container check

Build the production image from the repository root:

```sh
docker build -t xennguard .
```

To run it locally, provide a persistent PostgreSQL connection and a fresh `APP_KEY`, then map the configured `PORT` (defaults to 8080).
