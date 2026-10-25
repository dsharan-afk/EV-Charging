# EV Charging API

Node.js, Express, TypeScript, and SQLite REST API for the React/Vite EV Charging project.

## Local setup

1. Use Node.js 20 or newer.
2. Copy `.env.example` to `.env`; set `DATABASE_PATH` to the SQLite file location and `JWT_SECRET` to a random value of at least 32 bytes.
3. Run `npm install`, `npm run typecheck`, `npm run build`, and `npm start`. Use `npm run dev` during development.
4. The database and tables are initialized automatically on startup. Check `/health` and `/ready`.

`DATABASE_PATH` defaults to `./data/ev-charging.sqlite`, relative to the backend working directory. Set it to `:memory:` only for temporary local/test use. Back up the SQLite database file and its associated WAL files when the server is stopped.

## Render

Create a separate Web Service for this repository. Root Directory: `backend`; Build Command: `npm install && npm run build`; Start Command: `npm start`. Configure `DATABASE_PATH` to point inside a persistent disk mounted to the service, and set `JWT_SECRET`, `FRONTEND_ORIGINS=https://chargegrid-frontend.onrender.com`, and `NODE_ENV=production`.

SQLite files on Render's ephemeral filesystem are lost on certain restarts and redeploys. Attach and mount persistent storage for `DATABASE_PATH`, or use an appropriate hosted database if persistent disk storage is unavailable.

For the React Static Site, set `VITE_API_BASE_URL=https://ev-charging-bsa0.onrender.com/api/v1` and rebuild. This is a public frontend setting; never put backend secrets in Vite variables.

## Status and limitations

Charging sessions are simulated software records and are not connected to physical chargers or OCPP. Real card/UPI payments and verified payment webhooks are not implemented; demo wallet credits are disabled in production. Public registration creates CUSTOMER accounts only; provision administrators through a private operational process. The frontend context still uses mock data and synchronous actions and requires API-client integration/adapters. Passing the local tests does not by itself establish production readiness; deploy with persistent storage and evaluate operational monitoring, backups, and authentication/session policies before commercial use.
