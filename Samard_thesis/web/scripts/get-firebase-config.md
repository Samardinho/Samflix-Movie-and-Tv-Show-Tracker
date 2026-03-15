# Getting Firebase Config for Production

To fix the blank page issue, you need to set Firebase configuration values.

## Option 1: Get from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/movie-tv-show-tracker/settings/general)
2. Scroll down to "Your apps" section
3. Click on the web app (or create one if it doesn't exist)
4. Copy the `firebaseConfig` object values
5. Create `web/.env.production` file with:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=movie-tv-show-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=movie-tv-show-tracker
VITE_FIREBASE_STORAGE_BUCKET=movie-tv-show-tracker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=https://us-central1-movie-tv-show-tracker.cloudfunctions.net/api
```

6. Rebuild and redeploy:
```bash
cd web
npm run build
cd ..
firebase deploy --only hosting
```

## Option 2: Check Browser Console

Open the browser console (F12) on the blank page to see the actual error message. This will help identify what's missing.


