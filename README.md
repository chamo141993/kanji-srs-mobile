# Kanji SRS Mobile

Kanji SRS Mobile is an Expo / React Native study app for kanji lessons and reviews.

The project is currently split into three layers:

- a **native mobile app** that stores progress locally with SQLite
- a **web build** that mirrors the same study flow with browser `localStorage`
- an **optional Express backend** used for health checks, web dashboard data, and demo sync endpoints

This is no longer just a local-only prototype: the core study loop is still local-first, but the repo now also contains web-specific persistence and a small backend integration surface.

## Current product shape

Today the app supports:

- dashboard stats
- lesson queues
- review queues
- local progress tracking
- WaniKani-style subject import from bundled JSON
- browser storage support for Expo web
- backend-backed demo sync and web dashboard status

What it does **not** yet provide:

- real user accounts
- persistent cloud storage of study history
- production-grade auth
- full server-side lesson/review orchestration

## Architecture

### 1. App shell and routing

The Expo Router entrypoint is configured by:

- `package.json` → `"main": "expo-router/entry"`
- `app/_layout.tsx`

`app/_layout.tsx` provides:

- `SafeAreaProvider`
- global `StatusBar`
- a top-level Expo Router `Stack`
- shared dark background styling

Routes are intentionally thin:

- `app/index.tsx` → `DashboardScreen`
- `app/lesson.tsx` → `LessonScreen`
- `app/review.tsx` → `ReviewScreen`

That keeps navigation concerns inside `app/` and most behavior inside `src/screens/`.

### 2. Screen layer

#### `src/screens/DashboardScreen.tsx`

This is the operational hub of the app.

Responsibilities:

- initializes the platform data layer
- loads dashboard stats
- starts lesson and review sessions
- imports bundled WaniKani normalized JSON
- resets local sample/test progress
- on web, fetches backend dashboard data from `/api/web/dashboard`
- sends a demo sync payload to `/api/sync`

Important detail:

- the dashboard dynamically imports `../lib/db`, so Expo resolves:
  - `src/lib/db.ts` on native
  - `src/lib/db.web.ts` on web

That means the screen API stays the same while persistence changes by platform.

#### `src/screens/LessonScreen.tsx`

Responsibilities:

- loads pending lessons for the current user and level
- displays subject metadata:
  - characters
  - meanings
  - readings
  - mnemonics
- marks a lesson as learned
- advances the queue locally

Lessons are effectively the gate into the review system. Completing a lesson marks it available for immediate review.

#### `src/screens/ReviewScreen.tsx`

Responsibilities:

- loads due reviews
- reveals answers on demand
- grades correct / incorrect
- updates SRS state
- advances through the queue with lightweight feedback states

The review screen does not compute SRS rules itself; it delegates that to the data layer.

### 3. Data layer

The app uses a shared API surface with two implementations.

#### Native: `src/lib/db.ts`

This file is the main local-first engine for iOS and Android.

It uses `expo-sqlite` and owns:

- database open/init
- schema creation
- lightweight migration handling
- seed data
- import pipeline into SQLite
- lesson/review query helpers
- SRS progression logic
- dashboard stats aggregation

##### SQLite schema

The native database defines three tables:

- `users`
- `subjects`
- `review_statistics`

`review_statistics` is the core progress table and stores:

- whether the lesson has been completed
- current SRS stage
- next review timestamp
- last reviewed timestamp
- review counts
- correct/wrong counts

There is also a defensive migration helper that ensures the `lesson_completed` column exists even if the table was created by an older build.

##### Seed and import behavior

At initialization time the app:

- creates a local default user
- seeds a very small starter subject set
- seeds corresponding review statistics

The dashboard can then import the bundled normalized WaniKani level 1–5 JSON, which:

- inserts new subjects
- creates matching review rows
- leaves existing imported rows untouched via `INSERT OR IGNORE`

##### SRS progression

The SRS stages are:

- `APPRENTICE_1`
- `APPRENTICE_2`
- `APPRENTICE_3`
- `APPRENTICE_4`
- `GURU_1`
- `GURU_2`
- `MASTER`
- `ENLIGHTENED`
- `BURNED`

`calculateNextSrsState()` advances on correct answers and drops one stage on incorrect answers, then schedules the next review using fixed intervals.

##### Queue and dashboard helpers

Key exported operations include:

- `initializeDatabase()`
- `importSubjectsFromJson()`
- `resetSampleProgress()`
- `getPendingLessons()`
- `completeLesson()`
- `getPendingReviews()`
- `getDashboardStats()`
- `submitReviewAnswer()`

#### Web: `src/lib/db.web.ts`

Expo web resolves `../lib/db` to `db.web.ts`.

This file mirrors the same exported API as the native SQLite module, but stores state in:

- browser `localStorage` when available
- in-memory state as a fallback

That allows the same screens to run in the browser without bundling `expo-sqlite`.

In other words:

- **native** = SQLite-backed
- **web** = `localStorage`-backed
- **screen code** = mostly unchanged

### 4. Backend integration surface

#### Frontend config: `src/lib/api-config.ts`

This file centralizes backend URLs and the demo sync token:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SYNC_BEARER_TOKEN`

If unset, it falls back to:

- Render-hosted backend URL
- demo bearer token used by the current sync prototype

#### Backend: `backend/server.js`

The backend is a small Express 5 service with:

- `helmet`
- `cors`
- `express-rate-limit`
- `jsonwebtoken`
- `winston` logging via `backend/logger.js`

It currently exposes:

- `GET /api/health`
- `GET /api/web/dashboard`
- `POST /api/sync`
- `POST /api/user/sync`

##### What those endpoints do today

`GET /api/health`

- simple health/status response

`GET /api/web/dashboard`

- returns in-memory cloud-style dashboard data for web clients
- includes capability flags and service metadata

`POST /api/sync`

- accepts a demo sync payload
- checks a fixed bearer token
- updates an in-memory `webDashboardState`
- returns the normalized cloud progress plus summary data

`POST /api/user/sync`

- validates a JWT with `jsonwebtoken`
- echoes a small acceptance payload

##### Important limitation

The backend is currently **stateful but not durable**:

- synced progress is kept in memory
- restarting the backend loses that in-memory dashboard state
- there is no database behind the backend yet

So this backend is best understood as a prototype integration layer, not the source of truth for user study data.

### 5. CORS model

The backend contains explicit CORS handling so the Expo web app can fetch JSON from the backend.

Relevant env vars:

- `CORS_ORIGIN`
- `CORS_ORIGIN_SUFFIX`
- `CORS_ALLOW_ALL_HTTPS_ORIGINS`

Default behavior allows:

- common localhost dev origins
- `https` origins by suffix
- broad HTTPS access unless `CORS_ALLOW_ALL_HTTPS_ORIGINS=false`

This is the part of the stack that controls whether the web app can successfully fetch backend JSON such as `/api/web/dashboard`.

### 6. Data assets and import pipeline

Bundled assets live under:

- `assets/data/`

Important files:

- `wanikani-massive-dump.json`
- `wanikani-subjects-normalized.json`
- `wanikani-subjects-normalized-levels-1-5.json`

The app import button currently targets the normalized level 1–5 subset.

### 7. Scripts and dataset generation

#### `scripts/normalize-wanikani-dump.js`

Reads the raw dump and produces:

- fully normalized subjects JSON
- a level 1–5 subset used by the app

It filters supported subject types, normalizes meanings/readings, and converts the WaniKani format into the app's `Subject` shape.

#### `scripts/generate-data.js`

Creates a local synthetic WaniKani-style dump for development/testing.

#### `scripts/fetch-wanikani.js`

Fetches subject data from the WaniKani API and writes a large local dump.

This script exists in the repo, but treat its token handling as development-only and rotate or externalize credentials before any real reuse.

## Directory map

```text
app/                  Expo Router routes
assets/data/          Bundled JSON subject datasets
backend/              Express backend prototype
components/           Shared UI helpers/components
constants/            App constants/theme
hooks/                Theme/color hooks
scripts/              Data fetch/generate/normalize scripts
src/lib/              Native + web persistence and API config
src/screens/          Dashboard, lesson, and review screens
```

## Tech stack

### Frontend

- Expo
- React Native
- Expo Router
- TypeScript
- NativeWind / Tailwind-style utilities
- Expo SQLite

### Backend

- Node.js
- Express 5
- Helmet
- CORS
- express-rate-limit
- jsonwebtoken
- winston

## Local development

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Configure frontend env

```bash
cp .env.example .env
```

Current frontend env vars:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SYNC_BEARER_TOKEN`

### 3. Start the Expo app

```bash
npx expo start
```

Useful variants:

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
npx expo start --tunnel
```

### 4. Start the backend (optional, but needed for sync/web dashboard features)

```bash
cd backend
npm install
npm run dev
```

The backend defaults to port `8080`.

## Useful commands

### Frontend

```bash
npm run lint
npx tsc --noEmit
npm run normalize-wanikani-data
```

### Backend

```bash
cd backend
npm test
```

Note: the backend test script currently only prints a placeholder message; real backend tests are not configured yet.

## Current study flow

1. App launches to the dashboard.
2. The platform-specific data layer initializes.
3. A local default user is ensured.
4. Starter subjects/review rows are seeded if needed.
5. The user can import normalized WaniKani level 1–5 content.
6. Lessons are completed first.
7. Completed lessons become immediately reviewable.
8. Reviews update SRS stage and next review time.
9. On web, the dashboard can also display backend-provided cloud progress state.
10. The sync button sends a demo payload to the backend.

## Current limitations

- backend sync is demo-grade and in-memory
- no persistent remote database exists yet
- auth is partially mocked
- README-described cloud features should be treated as prototype integrations
- backend and frontend are not yet unified around a real user/account model

