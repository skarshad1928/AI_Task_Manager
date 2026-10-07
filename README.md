# AI Task Manager

## 1. Backend
cd backend
npm install
copy .env.example .env and set MONGO_URI + GEMINI_API_KEY
npm start

## 2. App
cd app
npm install
copy .env.example .env and set EXPO_PUBLIC_API_URL to your backend URL
npx expo start   (scan QR with Expo Go)

## Notes
- Mongo Atlas: allow your IP (or 0.0.0.0/0 while testing) in Network Access.
- Notifications: for reliable daily reminders, test in a development build / APK (EAS Build) if Expo Go limits them.
- Deploy the backend to Render using the included render.yaml blueprint. Add MONGO_URI and GEMINI_API_KEY as Render environment variables; never commit secret values.
- Set EXPO_PUBLIC_API_URL to the deployed API URL before building the app for production.
