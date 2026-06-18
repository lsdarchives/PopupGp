# PopupGp

A mobile app for discovering and hosting popup events in Gauteng. Users browse events on a map, hosts create and manage events, and admins approve them via a web dashboard.

---

## Tech Stack

| Layer           | Tech |
|---|---          |
| Mobile          | Expo 56 + Expo Router |
| Auth & Database | Firebase Auth + Firestore |
| Storage         | Firebase Storage |
| Admin Web       | Next.js (Phase 3) |
| Map             | react-native-maps + OpenStreetMap |

---

## Getting Started

### 1. Set up the GitHub repo
Clone the repo in Cursor:

*git clone https://github.com/lsdarchives/PopupGp.git


### 2. Set up the mobile app
```bash
cd mobile-app
npm install
```

### 3. Start the development server
```bash
npx expo start -c
```

### 4. Firebase setup
- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Authentication** (email/password) and **Firestore**
- Add your Firebase config to `mobile-app/src/services/firebase.ts`

---

## EAS Dev Build

Due to an SDK mismatch with the Expo Go app, the project uses an **EAS Dev Build** instead.

### Setup:

**1. Install expo-dev-client:**
```bash
npx expo install expo-dev-client
```

**2. Configure EAS:**
```bash
npx eas build:configure
```
- Configured as an Android build
- `eas.json` is generated automatically

**3. Build and install the APK:**
```bash
eas build --profile development --platform android
```
- Download and install the APK on your device
- Run `npx expo start --dev-client` and scan the QR code

---

## Project Structure

```
PopupGp/
  mobile-app/         # Expo React Native app
  firebase/           # Firestore rules and indexes
  shared/             # Shared TypeScript types
  admin-web/          # Next.js admin app (Phase 3)
  README.md
```

---

## App Flow

```
Splash screen (PopUpGp logo fade in/out)
       ↓
Role picker — User or Host
       ↓
Login / Sign Up (tabbed)
       ↓
User → Browse events       Host → My events
```

---

## Firestore Schema

### `users/{uid}`
| Field | Type | Description |
|---|---|---|
| `email` | string | User's email |
| `displayName` | string | Full name |
| `role` | string | `user`, `host`, or `admin` |
| `createdAt` | timestamp | Account creation date |

### `events/{eventId}` *(Phase 2+)*
| Field | Type | Description |
|---|---|---|
| `title` | string | Event name |
| `description` | string | Event details |
| `category` | string | Event category |
| `hostId` | string | UID of the host |
| `status` | string | `pending`, `approved`, `rejected` |
| `location` | object | `lat`, `lng`, `address` |
| `geohash` | string | For proximity queries |
| `startAt` | timestamp | Event start time |
| `endAt` | timestamp | Event end time |
| `rsvpCount` | number | Number of RSVPs |

### `rsvps/{id}` *(Phase 5+)*
| Field | Type | Description |
|---|---|---|
| `eventId` | string | Event reference |
| `userId` | string | User reference |
| `status` | string | `going`, `cancelled` |
| `createdAt` | timestamp | RSVP date |

---

## GitHub Workflow

Each phase gets its own branch. Never build directly on `main`.

```bash
# Start a new phase
git checkout main
git pull
git checkout -b feature/phase-N-short-name

# During development — commit often
git add .
git commit -m "Description of what you built"

# Push and open a PR
git push --set-upstream origin feature/phase-N-short-name
# Go to github.com/lsdarchives/PopupGp → open Pull Request → merge to main
```

### Branch naming
| Phase | Branch name |
|---|---|
| Phase 1 | `feature/phase-1-auth-foundation` |
| Phase 2 | `feature/phase-2-host-events` |
| Phase 3 | `feature/phase-3-admin-web` |
| Phase 4 | `feature/phase-4-user-map` |
| Phase 5 | `feature/phase-5-rsvp-and-polish` |
| Phase 6 | `feature/phase-6-docs` |

> Do not start the next phase until the current one is merged to `main` and tested on your device.

---

## Build Phases

| Phase | Focus                                                | Status |
|---|---|
| 0 |     Mobile shell + login                                 | ✅ Done |
| 1 |     Splash, role picker, register/login, Firestore rules | ✅ Done |
| 2 |     Host event creation and management                   | 🔄 In progress |
| 3 |     Next.js admin web — approve/reject events            | ⏳ Pending |
| 4 |     Uber-style map for users                             | ⏳ Pending |
| 5 |     RSVP, filters, profiles, images                      | ⏳ Pending |
| 6 |     Docs, README, demo script                            | ⏳ Pending |

---

## Design

- **Palette:** Red `#E8152A`, white, dark grey
- **Feel:** Sleek, minimal, bold
- **Slogan:** *Where the city comes alive*

---

## Environment Variables

Create `mobile-app/src/services/firebase.ts` with your Firebase config:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};


NB: Never commit real API keys to GitHub.
