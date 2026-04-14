# Kanji SRS Mobile

Local-first React Native kanji spaced-repetition app built with Expo, Expo Router, NativeWind, and local SQLite.

## What the app does

This app is a mobile-first kanji study tool inspired by WaniKani-style review flows.

Current functionality includes:

- a dashboard showing current level, pending reviews, and SRS breakdown
- a review screen for grading cards correct or incorrect
- local SQLite persistence for subjects and review statistics
- bundled JSON import for WaniKani-style subject data
- local-only progress tracking with no backend required

## Architecture summary

The app is intentionally simple and local-first.

### Routing and app shell

- `app/index.tsx` routes to the dashboard
- `app/review.tsx` routes to the review screen
- `app/_layout.tsx` sets up:
  - `SafeAreaProvider`
  - the Expo Router stack
  - the global status bar

### Screen layer

- `src/screens/DashboardScreen.tsx`
  - initializes the database
  - loads dashboard stats
  - starts review sessions
  - imports bundled JSON subject data
  - resets sample progress

- `src/screens/ReviewScreen.tsx`
  - loads pending reviews from SQLite
  - reveals the answer
  - submits correct or incorrect grades
  - advances SRS progress locally

### Data layer

- `src/lib/db.ts`
  - opens and initializes SQLite
  - defines the schema for:
    - `users`
    - `subjects`
    - `review_statistics`
  - seeds starter content
  - computes dashboard stats
  - fetches pending reviews
  - calculates next SRS states
  - imports WaniKani-style JSON into the local database

### Styling and config

- `global.css`
- `tailwind.config.js`
- `metro.config.js`
- `babel.config.js`

These files provide the NativeWind and Tailwind setup.

### Local data assets

- `assets/data/`

Bundled local JSON files live here and can be imported into SQLite.

Recommended WaniKani data layout:

- `wanikani-massive-dump.json` — raw source export from WaniKani
- `wanikani-subjects-normalized.json` — normalized full dataset used for app-friendly imports
- `wanikani-subjects-normalized-levels-1-5.json` — smaller normalized subset for the current in-app import button

Regenerate the normalized files from the raw dump with:

```bash
npm run normalize-wanikani-data
```

## Tech stack

- Expo
- React Native
- Expo Router
- NativeWind
- Expo SQLite
- TypeScript

## Install and start the app

### 1. Install dependencies

From the project directory:

```bash
npm install
```

### 2. Configure frontend API access

Copy the example env file and adjust it for your target backend:

```bash
cp .env.example .env
```

Frontend web/mobile API configuration uses Expo public env vars:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SYNC_BEARER_TOKEN`

Examples:

- local backend: `http://localhost:8080`
- deployed backend: `https://kanji-backend-dtyx.onrender.com`

The backend also supports CORS configuration through:

- `CORS_ORIGIN` for exact allowed origins
- `CORS_ORIGIN_SUFFIX` for allowed HTTPS hostname suffixes such as `onrender.com`

### 3. Start the Expo development server

```bash
npx expo start
```

This starts Metro and shows a QR code in the terminal.

If local network discovery is unreliable, use:

```bash
npx expo start --tunnel
```

## Run the app on a mobile device

### Android

1. Install **Expo Go** from the Google Play Store.
2. Make sure your Android phone and your computer are on the same Wi-Fi network.
3. Start the Expo server:

   ```bash
   npx expo start
   ```

4. Open **Expo Go** on the phone.
5. Scan the QR code shown in the terminal or Expo dev tools.
6. The app should open on the device.

If it does not connect:

- retry with `npx expo start --tunnel`
- check that VPN or firewall settings are not blocking the connection

### iPhone

1. Install **Expo Go** from the App Store.
2. Make sure your iPhone and your computer are on the same Wi-Fi network.
3. Start the Expo server:

   ```bash
   npx expo start
   ```

4. Open the iPhone Camera app and scan the QR code.
5. Tap the Expo link prompt.
6. The app should open in **Expo Go**.

If LAN mode fails, restart with:

```bash
npx expo start --tunnel
```

## Useful commands

```bash
npm run lint
npx tsc --noEmit
npx expo start
npx expo start -c
```

`npx expo start -c` clears the Metro cache, which is useful after dependency or bundler changes.

## Current app flow

1. The app launches into the dashboard.
2. The dashboard initializes the local SQLite database.
3. Starter subjects and review stats are seeded if needed.
4. The import button loads the bundled normalized WaniKani level 1–5 JSON into the local database.
5. Starting reviews opens the review queue.
6. Grading a card updates the local SRS stage and schedules the next review.

## Notes

- The app is local-first and currently does not require a backend server.
- Progress is stored on-device in SQLite.
- Bundled import data is intended for local development and testing.
