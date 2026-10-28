<div align="center">

# ⚡ ChargeGrid — EV Charging Station Management

**Find charging stations. Plan charging sessions. Keep your journey moving.**

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-typed-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-powered-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

[**🚀 Live Website**](https://chargegrid-frontend.onrender.com) · [**🔌 Backend Health**](https://ev-charging1-r7su.onrender.com/health) · [**🧭 Features**](#-features) · [**⚙️ Run Locally**](#-getting-started) · [**🛠️ Configuration**](#-environment-configuration)

</div>

---

## 📚 Contents

<details open>
<summary><strong>Explore this README</strong></summary>

- [About the project](#-about-the-project)
- [Features](#-features)
- [Technology stack](#-technology-stack)
- [Architecture](#-project-structure)
- [Getting started](#-getting-started)
- [Environment configuration](#-environment-configuration)
- [Location and privacy](#-location-and-privacy)
- [Backend scripts](#-backend-scripts)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

</details>

## 🌱 About the project

ChargeGrid is a web application concept for discovering EV charging stations and managing the charging journey from one place. It combines a responsive React interface with a TypeScript API backend and a map-based station discovery experience.

The project is designed to make it easier to explore charging locations, review connector availability, manage vehicles, and work through a charging booking flow.

## ✨ Features

| Feature | What it does |
| --- | --- |
| 🗺️ **Station discovery** | Explore charging stations through the station browsing and map experience. |
| 📍 **Nearby search** | When you choose **Use my location**, the browser can request your permission to locate you and prioritize coordinate-enabled stations by distance. |
| 🔌 **Connector filters** | Browse supported connector types and charging-speed categories available in the interface. |
| ⚡ **Availability details** | Review station and port status where data is available. |
| 🚗 **Vehicle management** | Work with vehicle information in the account experience. |
| 📅 **Booking flow** | Select a station/port and move through the booking experience. Actual actions depend on backend configuration and API availability. |
| 💳 **Payment UI** | Payment-method interfaces are present; configured payment methods are marked demo-only or unverified by the backend. This project does not claim to process real payments. |
| 👤 **Account experience** | Registration/sign-in and authenticated API flows are supported by the backend. |
| 🌗 **Interface preferences** | Theme, search, navigation, and other UI conveniences included in the app. |

> **Note:** Available stations, live status, bookings, and other data depend on the configured backend and the data it returns. Do not assume that every station shown in sample data is a live charger.

## 🧰 Technology stack

- **Frontend:** React, TypeScript, Vite
- **UI and interaction:** Tailwind CSS tooling, Motion, Lucide icons
- **Maps:** Google Maps React integration (`@vis.gl/react-google-maps`)
- **Backend:** Node.js, Express, TypeScript
- **Data storage:** SQLite via `better-sqlite3`
- **API security and validation:** JWT, bcrypt, Helmet, CORS, rate limiting, Zod
- **Hosting:** Render (frontend and backend services)

## 🗂️ Project structure

```text
EV-Charging/
├── src/
│   ├── components/       # Screens and reusable UI components
│   ├── data/             # Local/sample data helpers
│   ├── lib/api.ts        # Frontend API client
│   ├── App.tsx           # Main app composition
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── backend/
│   ├── src/              # Express API and database setup
│   └── test/             # Backend integration tests
├── package.json          # Frontend scripts and dependencies
└── README.md
```

## ⚙️ Getting started

### Prerequisites

- [Node.js 20 or newer](https://nodejs.org/) and npm
- Git
- A configured backend URL for API-backed features
- Google Maps API key if your local map configuration requires one

### 1. Clone the repository

```bash
git clone https://github.com/dsharan-afk/EV-Charging.git
cd EV-Charging
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the frontend API URL

Create a local `.env` file in the project root (do not commit it) and add:

```dotenv
VITE_API_BASE_URL=https://ev-charging1-r7su.onrender.com
```

If you are running the backend locally, use its local URL instead, matching the port configured by your backend.

### 4. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite. This project config uses port `3000` by default.

### 5. Build and type-check

```bash
npm run lint
npm run build
```

The `lint` script runs the TypeScript compiler without emitting files; `build` creates the production frontend build in `dist/`.

## 🔐 Environment configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend `.env` | Base URL for API requests made by the browser. |
| Backend environment variables | `backend/.env` or Render environment settings | Configure the API, security secrets, CORS/origin policy, and database according to `backend/src/server.ts` and the backend configuration. |
| Google Maps key (if required by current map setup) | Frontend environment / hosting settings | Enables Google Maps features. Use the exact variable name expected by the map component. |

**Security reminders**

- Never commit `.env` files, API keys, access tokens, database files, or production secrets.
- Frontend variables prefixed with `VITE_` are exposed to the browser. Never put private credentials in them.
- Use a strong, unique JWT secret in production and configure CORS to allow only the intended frontend origin.

## 📍 Location and privacy

Nearby search uses the browser's Geolocation API only after the user chooses to enable location. The browser controls the permission prompt.

- Location access requires **HTTPS** or `localhost` in supported browsers.
- If permission is denied or location is unavailable, use the existing station/city browsing options instead.
- Distance sorting requires station records to include valid latitude and longitude coordinates.
- The feature should not be treated as proof of real-time charger availability; availability depends on the data source.
- You can revoke the site's location permission through your browser settings.

## 🧪 Backend scripts

From the `backend/` directory:

```bash
npm install
npm run build
npm test
npm start
```

- `npm run build` compiles the backend TypeScript project.
- `npm test` runs the backend integration tests.
- `npm start` starts the compiled server from `dist/`.

Make sure the backend's required environment variables are configured before starting it. For local development, check `backend/.env.example` if present and use a local `.env` file without committing secrets.

## 🚀 Deployment

The hosted frontend and backend are separate Render services:

- **Frontend:** [chargegrid-frontend.onrender.com](https://chargegrid-frontend.onrender.com)
- **Backend health endpoint:** [ev-charging1-r7su.onrender.com/health](https://ev-charging1-r7su.onrender.com/health)

For deployment, set the frontend's `VITE_API_BASE_URL` to the deployed backend base URL and configure the backend CORS policy to allow the frontend's exact origin. After changing frontend environment variables, rebuild/redeploy the frontend so Vite includes the new configuration.

## 🧯 Troubleshooting

<details>
<summary><strong>Map or location permission is not working</strong></summary>

1. Open the site over HTTPS or `localhost`.
2. Click the app's **Use my location** control.
3. Allow location in the browser prompt.
4. If you previously blocked it, open the browser's site permissions and change Location to Allow.
5. Confirm that station records have valid coordinates before expecting distance-based sorting.

</details>

<details>
<summary><strong>The frontend cannot reach the backend</strong></summary>

1. Check that `VITE_API_BASE_URL` is set correctly.
2. Open the backend health endpoint above.
3. Check the browser DevTools **Network** tab for the failing request and response status.
4. Confirm the backend's CORS allow-list includes the frontend origin.
5. Restart/rebuild the frontend after changing `.env` values.

</details>

<details>
<summary><strong>Sign-in or booking requests fail</strong></summary>

1. Confirm the backend is running and its database is initialized.
2. Inspect the API response in DevTools **Network**.
3. Check backend logs for validation, authentication, or database errors.
4. Remember that protected endpoints require a valid access token and that payment methods may be demo-only.

</details>

<details>
<summary><strong>Build fails locally</strong></summary>

```bash
node --version
npm --version
npm install
npm run lint
npm run build
```

Use Node.js 20 or newer for the backend. Review the first compiler error rather than relying only on the final summary line.

</details>

## 🤝 Contributing

Contributions and improvements are welcome.

1. Create a branch for your change.
2. Keep changes focused and avoid unrelated UI/API modifications.
3. Run the relevant type-check, build, and tests.
4. Describe the change and include screenshots for visible UI changes where helpful.
5. Open a pull request with a clear summary and testing notes.


<div align="center">

**Built to make the EV charging journey easier. ⚡**

[⬆ Back to top](#-chargegrid--ev-charging-station-management)

</div>
