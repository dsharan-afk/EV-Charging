# EV Charging API

Node.js, Express, TypeScript, Mongoose REST API for the React/Vite EV Charging project.

## Local setup

1. Use Node.js 20 or newer and a MongoDB Atlas database.
2. Copy `.env.example` to `.env`; configure `MONGO_URI` and a random `JWT_SECRET` of at least 32 bytes.
3. Run `npm install`, `npm run build`, and `npm start`. Use `npm run dev` during development.
4. Check `/health` and `/ready`.

## Render

Create a separate Web Service for this repository. Root Directory: `backend`; Build Command: `npm install && npm run build`; Start Command: `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `FRONTEND_ORIGINS=https://chargegrid-frontend.onrender.com`, and `NODE_ENV=production` in Render environment variables.

For the React Static Site, set `VITE_API_BASE_URL=https://ev-charging-bsa0.onrender.com/api/v1` and rebuild. This is a public frontend setting; never put backend secrets in Vite variables.

## Status and limitations

The first API implementation is not yet a verified production release. The frontend context still uses mock data and synchronous actions and requires API-client integration/adapters. Real card/UPI payments and verified gateway webhooks are not implemented. Charging sessions are software-only and not connected to physical hardware/OCPP. Booking concurrency and wallet/payment behavior must be hardened and tested against a replica-set test database before commercial use. Automated integration tests and live database verification have not yet been run. Bearer JWTs should not be stored in localStorage; add a secure session/refresh strategy before production. Public registration can create CUSTOMER accounts only; admin provisioning must remain private.
