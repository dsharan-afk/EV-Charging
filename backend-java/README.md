# ChargeGrid Java Backend

Java 21 / Spring Boot REST API starter for the EV Charging React/Vite frontend.

## Run locally
Install JDK 21 and Maven 3.9+ then:
```powershell
$env:APP_ENV = "development"
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
mvn spring-boot:run
```
Health check: `http://localhost:8080/health`. SQLite DB is created at `data/chargegrid.db`.
Local Maven commands require Maven to be installed. The Render Docker build uses the Maven/Java toolchain defined by the Dockerfile.
The application defaults to production behavior when `APP_ENV` is unset and rejects unrecognized values. Set `APP_ENV=development` explicitly for local development.

## Implemented API routes
- `GET /health`, `/ready`, `/api/v1/health`
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `GET/PATCH /api/v1/me`
- `GET /api/v1/stations`, `GET /api/v1/stations/{id}`, `POST /api/v1/admin/stations`
- `GET/POST /api/v1/vehicles`, `PATCH/DELETE /api/v1/vehicles/{id}`, `POST /api/v1/vehicles/{id}/primary`
- `GET/POST /api/v1/bookings`, `POST /api/v1/bookings/{id}/cancel`
- `GET/POST /api/v1/sessions`, `POST /api/v1/sessions/{id}/pause|resume|stop`
- `GET /api/v1/wallet`, `POST /api/v1/wallet/demo-credit`

## Environment
- `PORT`: HTTP listener port (defaults to `8080` locally; supplied by Render).
- `APP_ENV=production`: disables demo wallet credit and enables production startup checks; this is the default when unset. Only set `APP_ENV=development` for local development.
- `JWT_SECRET`: required in every environment. Use a locally generated value for development and a separate unique secret of at least 32 characters in production. No signing secret is hardcoded in the application.
- `CORS_ALLOWED_ORIGINS`: comma-separated exact origins, for example `https://chargegrid-frontend.onrender.com`. Production requires this setting; wildcard origins are rejected.
- `SQLITE_PATH`: SQLite database file path. For Render, attach a persistent disk mounted at `/var/data` and set `SQLITE_PATH=/var/data/chargegrid.db`. Production requires an absolute file path and does not use the local relative default.
- `DEFAULT_PRICE_PER_KWH`: default station tariff in INR per kWh when an admin creates a station without specifying its own rate (default: `18.00`).

## Render build and start
Use the Render Docker runtime with **Root Directory** set to `backend-java` and **Dockerfile Path** set to `Dockerfile`. Render builds using the Dockerfile's `mvn -q -DskipTests package` command and starts the packaged application with `java -jar /app/app.jar`. The Dockerfile supplies Maven 3.9 and Java 21; a Maven wrapper is not included, so do not rely on a native Render image having Maven installed. Its runtime image creates `/root/.ssh` with mode `0700` for Render-managed Shell access. It does not install or run an SSH daemon; access remains subject to Render's service-plan eligibility and dashboard permissions. The application binds to Render's `PORT` and stores SQLite at the configured persistent-disk path. Configure the environment variable names above; do not include secret values in source control.

`/health` and `/api/v1/health` are liveness checks. `/ready` checks SQLite and returns HTTP 503 when the database cannot be queried. Demo station seed records are created only outside production; provision real stations through the admin API after securely creating an admin account.

## Provision the first production administrator
First-admin creation is an explicit one-shot CLI operation, not an HTTP route or normal startup action. It only runs in production when `--provision-first-admin` is passed. It requires `APP_ENV=production`, the production `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, and `SQLITE_PATH`, plus the temporary `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` environment variables. `FIRST_ADMIN_NAME` is optional. The command hashes the password with the application's BCrypt password encoder. It refuses if any administrator already exists or if the email belongs to any existing account; it does not promote or overwrite accounts.

After deploying on a Render plan that supports Shell access, use the Shell for the actual deployed web-service instance with its persistent disk mounted at `/var/data`. Do not use an ephemeral shell or one-off job: these run on separate compute and cannot access this service's persistent disk. Confirm that the disk and production environment variables are available in the shell. At the interactive prompt, enter the following shell lines; the password input is not echoed and neither credential is part of the command history:
```sh
set +x
printf 'Administrator email: '
IFS= read -r FIRST_ADMIN_EMAIL
printf 'Administrator password: '
stty -echo
IFS= read -r FIRST_ADMIN_PASSWORD
stty echo
printf '\n'
export FIRST_ADMIN_EMAIL FIRST_ADMIN_PASSWORD
java -jar /app/app.jar --provision-first-admin
provision_status=$?
unset FIRST_ADMIN_EMAIL FIRST_ADMIN_PASSWORD
if [ "$provision_status" -ne 0 ]; then
  printf 'Provisioning failed; review the service logs for the non-secret error message.\n'
  exit "$provision_status"
fi
```
Run this only once. A successful command exits without starting the web server. If it fails because an administrator already exists, do not try to bypass the guard. Additional administrators require a separately approved, audited operator maintenance procedure: verify the person's identity, create their individual account, take a current database backup, and apply a reviewed role change transactionally using trusted database tooling. There is deliberately no public role-promotion endpoint and the first-admin command will never promote an existing user.

Production does not seed demo stations. After provisioning, sign in through `POST /api/v1/auth/login` using a trusted API client, then use the returned administrator JWT with `POST /api/v1/admin/stations` to create each intended station. Provide the station's actual `name`, `address`, `city`, and `state`; optionally provide its real coordinates, status, connector type, power, tariff, and port count. Review the resulting station through `GET /api/v1/stations`. No station records are invented or added by the bootstrap command.

Station `price_per_kwh` values and booking `estimated_cost` values are expressed in INR. Booking energy is required, must be greater than zero and at most 500 kWh, and supports up to six decimal places. Estimated cost is `estimated_kwh × station price_per_kwh`, rounded to two decimal places. The one-time SQLite migration uses `PRAGMA user_version` and only converts the known legacy demo station IDs when their stored rates match the legacy seed values (for example `station-demo-1=1800`). It leaves other rates and associated estimates untouched because an older database does not identify whether an arbitrary value above ₹100 is paise or already-valid INR. Review custom legacy rates separately before deploying if they used the old paise convention.

## Important limitations before public deployment
This is a functional initial implementation, not a verified drop-in replacement. It must be compiled and tested locally, then API response fields should be reconciled with the actual frontend and original Node API. No real charger telemetry, payment processing, email verification, password reset, or automated additional-admin management is included. Do not deploy until the build and endpoint tests pass. Public registration creates CUSTOMER accounts only.
