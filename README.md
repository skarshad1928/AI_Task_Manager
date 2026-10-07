# AI Task Manager

## Backend setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm start
```

Set `MONGO_URI` and `GEMINI_API_KEY` in `backend/.env`. Keep these backend secrets out of the app and Git. For Render, use the included root `render.yaml` blueprint and add both values as Render environment variables. Configure MongoDB Atlas Network Access to allow your deployment host.

## App setup

```powershell
cd app
npm install
Copy-Item .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `app/.env` to the backend URL. Expo Go can run the other app screens, but it does not include the custom Android usage module.

## Deploy the web app to GitHub Pages

The web build is published automatically by GitHub Actions after changes reach `main`. Merge the feature branch into `main`, then in the GitHub repository open **Settings > Pages** and set **Build and deployment > Source** to **GitHub Actions**. The published app will be at `https://skarshad1928.github.io/AI_Task_Manager/` and calls the Render API. The Usage tab shows an Android-only message on the web; Android app-usage tracking still requires the development APK below.

To build the web app locally:

```powershell
cd app
npm ci
npx expo export --platform web
```

The static site is written to `app/dist`.

## Android Usage Access development build

App usage tracking requires Android and the custom development build. It does not work in Expo Go or on iOS.

```powershell
cd app
eas build --profile development --platform android
```

Install the generated APK. Open the app's **Usage** tab and choose **Open Usage access settings**. In Android Settings, select **AI Task Manager** and enable **Permit usage access**, then return to the app and refresh.

The app reads only daily open counts and foreground minutes for Google Chrome (`com.android.chrome`) and YouTube (`com.google.android.youtube`). It does not collect URLs, browsing history, or video titles. Once access is granted, it syncs today's totals to `POST /usage` on app open and rechecks at least daily while the app remains open; `GET /usage?days=7` supplies the history.

## Daily score

The score is out of 100: water 15, study tasks 25, sleep 20, focus timer 10, routine 10, and digital habits 10. Chrome or YouTube usage above 120 minutes each removes 5 digital-habits points. Completing all water goals adds a 10-point bonus. The Gemini summary receives the day's usage totals when available.

## Existing features

- Two daily 1-liter water reminders at 10:00 and 17:00.
- Study and urgent tasks with a focus timer.
- Bedtime and wake-time logging.
- BMI calculation and blood-report PDF upload for Gemini-generated food guidance.
- MongoDB storage and Gemini daily summaries.
