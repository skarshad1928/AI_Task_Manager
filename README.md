# AI Task Manager

A mobile-first React app with a Node.js/Express API, MongoDB Atlas storage, and Gemini-powered report guidance and daily reflections.

## Local setup

Use Node.js 20 or newer. Create `server/.env` from `server/.env.example`. During local development, the client defaults to `http://localhost:5000/api`; create `client/.env` from `client/.env.example` only if your API runs at another address.

### Server

```powershell
cd server
npm install
npm start
```

The API listens on port `5000` by default. The server needs `MONGO_URI`, `GEMINI_API_KEY`, and `CLIENT_URL` in `server/.env`.

### Client

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The client uses the local API default above. Build the production client with `npm run build`; the output is `client/dist`.

## Environment variables

### `server/.env`

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string for this app's database |
| `GEMINI_API_KEY` | Google AI Studio key for Gemini features |
| `CLIENT_URL` | Exact browser client origin allowed by CORS, such as `http://localhost:5173` |
| `PORT` | Optional server port; defaults to `5000` |

### `client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Public base URL of the server API, ending in `/api`. Defaults to `http://localhost:5000/api` in local development; set it for deployed builds. |

The Gemini key and MongoDB URI are only read by the server. Do not add either secret to a `VITE_` variable.

## Features

- Two water routines are created for each date: 1 liter at 10:00 and 1 liter at 17:00.
- Browser notifications can remind you about water at 10:00 AM and 5:00 PM and meals at 8:30 AM, 12:40 PM, and 7:45 PM. Grant notification permission; reminders run while the app or installed PWA is open.
- Add study, immediate, and personal routine tasks; complete or delete them; track focus time and save it when pausing.
- Capture sleep start and end times with buttons, count middle-of-night wake-ups, and save sleep that crosses midnight.
- Save height and weight and calculate BMI on the server.
- Upload a blood report CSV up to 1 MB for Gemini to summarize abnormal values, Indian-friendly food ideas, iron and vitamin C pairings, and sleep tips.
- Finish the day to save a 100-point score and a friendly Gemini summary in score history.

Score categories total exactly 100: water goals 20, personal routines 20, study and immediate tasks 30, sleep 20, and focus time 10. Water points come from the two water tasks. Routine points use only user-created personal routines, so water tasks are not counted in both categories. If no personal routines were planned, that category is not applicable and receives its full 20 points. Sleep awards 10 points for 7–9 hours and 10 for a bedtime from 18:00 through 23:59. Focus earns up to 10 points for one hour.

The client has a web manifest and service worker and can be installed from a supported mobile browser's **Add to Home screen** or **Install app** option. The UI shell can load from cache, but task, health, sleep, report, and score data need an internet connection to reach the server.

## API routes

- `GET /api/tasks?date=YYYY-MM-DD` and `POST /api/tasks`
- `PUT /api/tasks/:id` and `DELETE /api/tasks/:id`
- `POST /api/sleep` and `GET /api/sleep/:date`
- `GET /api/profile` and `POST /api/profile`
- `POST /api/report` with multipart field `csv`
- `POST /api/score/:date` and `GET /api/score`
- `GET /api/health`

## Deploy

### Server on Render

Create a Render Web Service from this repository and set its **Root Directory** to `server`. Use `npm install` as the build command and `npm start` as the start command. Add `MONGO_URI`, `GEMINI_API_KEY`, and `CLIENT_URL` as Render environment variables. Set `CLIENT_URL` to the deployed client origin, with no path or trailing slash.

### Client on Vercel

Import the repository as a Vercel project and set the **Root Directory** to `client`. Use `npm run build` and `dist` as the output directory. Add `VITE_API_URL=https://<your-render-service>.onrender.com/api` as a client build environment variable. `vercel.json` includes the single-page app rewrite.

### Client on Netlify

Create a Netlify site with the base directory `client`, build command `npm run build`, and publish directory `dist`. Set the same `VITE_API_URL` build variable. The included `_redirects` file routes browser paths back to the React app.

### MongoDB Atlas network access

In Atlas **Network Access**, allow the outbound IP address or CIDR used by the Render service to connect to the cluster. For local development, allow your current IP address. Avoid opening access to every address unless you intentionally accept that exposure.

## Verify

Run the API route checks with `cd server; npm test`. They start an HTTP server with isolated in-memory model doubles, so they do not require or change Atlas data. Run the production client build with `cd client; npm run build`.
