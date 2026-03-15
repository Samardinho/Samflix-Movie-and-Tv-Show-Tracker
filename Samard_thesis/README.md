# 🎬 Samflix

A modern web application that allows users to track movies and TV shows. It includes functionality for signup/login, managing watchlists, tracking progress, search, getting ratings, giving ratings, and viewing detailed information through third-party APIs (TMDb).

## ✨ Features

- **User Authentication**: Sign up, login, and profile management
- **Watchlist Management**: Add movies and TV shows to your watchlist with status tracking (Plan to Watch, Watching, Completed, Dropped)
- **Progress Tracking**: Track which season and episode you're on for TV shows
- **Ratings**: Rate movies and TV shows on a 10-point scale
- **Search**: Search for movies and TV shows using TMDb API
- **Detailed Information**: View comprehensive details about movies and TV shows
- **AI Chatbot Assistant** (Optional): Get personalized recommendations and help discovering content using OpenAI

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (use nvm if you have an older version)
- npm or yarn
- Firebase account
- TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))
- OpenAI API key (optional, for AI Chatbot feature - [Get one here](https://platform.openai.com/api-keys))

### Automated Setup

Run the setup script to install Firebase CLI and configure everything:

```bash
./setup-firebase.sh
```

This script will:
- Check/install Node.js 20+ (via nvm if needed)
- Install Firebase CLI globally
- Log you into Firebase
- Help configure your project ID
- Set up TMDb API key
- Deploy Firestore security rules

### Manual Setup

If you prefer to set up manually:

#### 1. Install Firebase CLI

```bash
# Install nvm (if needed)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20

# Install Firebase CLI
npm install -g firebase-tools
firebase login
```

#### 2. Configure Firebase Project

```bash
# Update .firebaserc with your project ID
# Edit the file and replace "your-firebase-project-id" with your actual project ID

# Set TMDb API key
firebase functions:config:set tmdb.key="YOUR_TMDB_API_KEY"

# Deploy Firestore rules
firebase deploy --only firestore:rules,firestore:indexes
```

#### 3. Set Up Frontend Environment

Create `web/.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:5001/your-project-id/us-central1/api
```

Get these values from Firebase Console > Project Settings > General > Your apps > Web app

#### 4. Install Dependencies

```bash
# Install backend dependencies
cd functions
npm install

# Install frontend dependencies
cd ../web
npm install
```

#### 5. Run Development Servers

**Terminal 1 - Firebase Emulators:**
```bash
firebase emulators:start
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

Visit `http://localhost:5173` (or the port Vite assigns)

## 📁 Project Structure

```
root/
  functions/                   # Firebase Cloud Functions (TS)
    src/
      index.ts                 # HTTP endpoints for TMDb proxy
      tmdb.ts                  # TMDb API client
    package.json
    tsconfig.json

  web/                         # React + TS frontend
    src/
      main.tsx                 # App entry point
      App.tsx                  # Router setup
      routes/                  # Page components
        HomePage.tsx
        LoginPage.tsx
        RegisterPage.tsx
        SearchPage.tsx
        MovieDetailPage.tsx
        TvDetailPage.tsx
        WatchlistPage.tsx
        ProfilePage.tsx
        NotFoundPage.tsx
      components/
        layout/                # Navbar, Footer, Shell, ProtectedRoute
        auth/                  # LoginForm, RegisterForm
        movies/                # MediaCard, RatingStars, ProgressTracker, StatusBadge
        common/                # Loader, ErrorState, EmptyState, SearchBar, ConfirmDialog
      hooks/
        useAuth.tsx            # Authentication context & hook
        useUserEntries.ts      # Firestore CRUD for watchlist entries
      lib/
        firebase.ts            # Firebase initialization
        apiClient.ts           # TMDb API client (calls Cloud Functions)
        queryClient.ts         # React Query setup
      types/
        tmdb.ts                # TMDb API types
        domain.ts              # Domain types (UserEntry, etc.)
      styles/
        globals.css            # Tailwind imports

  firebase.json                # Firebase config
  .firebaserc                  # Firebase project ID
  firestore.rules             # Security rules
  firestore.indexes.json       # Firestore indexes
```

## 🎯 Features

### Authentication
- ✅ User signup/login with email and password
- ✅ Protected routes (watchlist, profile)
- ✅ Session management with Firebase Auth

### Search & Discovery
- ✅ Search movies and TV shows via TMDb
- ✅ View detailed information (poster, overview, genres, ratings)
- ✅ Browse by media type

### Watchlist Management
- ✅ Add movies/TV shows to watchlist
- ✅ Track status: Plan to Watch, Watching, Completed, Dropped
- ✅ Rate content (0-10 stars)
- ✅ Track TV show progress (season/episode)
- ✅ View watchlist grouped by status
- ✅ Delete entries

### User Profile
- ✅ View account information
- ✅ Watchlist statistics
- ✅ Logout functionality

## 🔧 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router 7** - Routing
- **Tailwind CSS** - Styling
- **@tanstack/react-query** - Data fetching & caching
- **Firebase SDK v9+** - Auth & Firestore
- **Axios** - HTTP client

### Backend
- **Firebase Cloud Functions** (Node.js + TypeScript)
- **Firebase Firestore** - Database
- **Firebase Authentication** - User management
- **TMDb API** - Movie/TV data

## 📝 Environment Variables

### Frontend (`web/.env`)
All variables prefixed with `VITE_` are exposed to the browser.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=
```

### Backend (`functions`)
TMDb API key is stored securely in Firebase Functions config:
```bash
firebase functions:config:set tmdb.key="YOUR_KEY"
```

**OpenAI API Key (for AI Chatbot feature):**
The AI Chatbot feature requires an OpenAI API key. Set it in Firebase Functions config:
```bash
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

For local development, you can also set it in `functions/.env`:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

**Note:** Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys). The chatbot feature is optional - the app will work without it, but the `/assistant` route will return errors if the key is not configured.

## 🗄️ Firestore Data Model

### Collections

**users/{uid}**
```typescript
{
  email: string
  createdAt: Timestamp
}
```

**users/{uid}/entries/{tmdbId}**
```typescript
{
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  posterPath: string | null
  status: "plan" | "watching" | "completed" | "dropped"
  rating: number | null (0-10)
  season: number | null (TV only)
  episode: number | null (TV only)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 🚢 Deployment

### Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Deploy Frontend
```bash
cd web
npm run build
firebase deploy --only hosting
```

### Deploy Everything
```bash
firebase deploy
```

## 🐛 Troubleshooting

### Firebase CLI not found
- Install Node.js 20+ first
- Use `nvm` to manage Node versions
- Run `npm install -g firebase-tools` with proper permissions

### TypeScript errors before npm install
- These are expected. Run `npm install` in both `functions` and `web` directories first.

### TMDb API errors
- Ensure your API key is set: `firebase functions:config:get`
- Check that Cloud Functions are deployed and running
- Verify `VITE_API_BASE_URL` points to the correct endpoint

### Firestore permission errors
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that users are authenticated when accessing protected data

## 📄 License

MIT

## 🙏 Credits

- [TMDb API](https://www.themoviedb.org/) for movie/TV data
- [Firebase](https://firebase.google.com/) for backend infrastructure


