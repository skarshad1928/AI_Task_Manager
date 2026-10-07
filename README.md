# AI Task Manager

AI Task Manager is a responsive React web app backed by a Node.js/Express API and MongoDB. The web app is in `web/`; API routes and data models are in `backend/`.

## Run locally

Install dependencies from the repository root:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item web/.env.example web/.env
```

Set `MONGO_URI` and `GEMINI_API_KEY` in `backend/.env`. Set `VITE_API_URL=http://localhost:5000` in `web/.env`, then run the API and web app in separate terminals:

```powershell
npm start
```

```powershell
npm run dev
```

Open the Vite URL shown in the terminal. To build the React app, run `npm run build`; the static files are written to `web/dist`.

## Deploy

The Render blueprint in `render.yaml` builds the React app and starts the Node.js server, which serves both the API and the built web app. Add `MONGO_URI` and `GEMINI_API_KEY` to the Render service environment. If serving the frontend from a separate domain, set `VITE_API_URL` to the API URL when building.

The GitHub Actions workflow also publishes the React static site to GitHub Pages when changes are pushed to `main`. Enable **Settings > Pages > Build and deployment > GitHub Actions** in the repository. The workflow points the web app at the Render API.

## Features

- Daily tasks and water routines, with browser notifications while the app is open.
- Focus timer with task-level time tracking.
- Bedtime and wake-time logging.
- BMI calculation and blood-report PDF upload for Gemini-generated food guidance.
- Daily wellness score and Gemini summary.
- Seven-day Chrome and YouTube usage history synced from Android.

Device-wide Chrome and YouTube usage collection requires Android usage access and is not available to web browsers. The web app displays the usage records synced to the API. The Android tracker source remains in `app/`.

## Backend environment

See `backend/.env.example`. Keep backend secrets out of the frontend and Git. MongoDB Atlas must allow connections from the deployment host.

## Android usage collector

Usage tracking requires an Android development build; Expo Go and iOS do not support the custom module. Configure `EXPO_PUBLIC_API_URL` in `app/.env`, then build with:

```powershell
cd app
npm install
eas build --profile development --platform android
```

Grant **Usage access** to AI Task Manager in Android Settings. It reads daily open counts and foreground minutes only for Chrome and YouTube; it does not collect URLs, browsing history, or video titles.
