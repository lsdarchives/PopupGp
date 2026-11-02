# PopupGp

A mobile app for discovering and hosting popup events in Gauteng. Hosts can create and manage events, users can browse approved events and RSVP, and admins can moderate submissions in a web console.

---

## Tech Stack

| Layer           | Tech |
|---|---|
| Mobile          | Expo 56 + Expo Router |
| Auth & Database | Firebase Auth + Firestore |
| Backend         | Firebase Cloud Functions |
| Payments        | Stripe (native mobile checkout) |
| Admin Web       | React + Vite |
| Map             | MapLibre + OpenFreeMap (native); event list fallback on web |

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

### 3. Run the mobile app in a browser
```bash
npm run web
```

If port 8081 is already in use, select another port:

```bash
npm run web -- --port 8082
```

The browser build uses a list-based map preview. The MapLibre map and Stripe checkout are native-mobile features; paid checkout is not available in the web preview.

### 4. Run the admin console
```bash
cd admin-web
npm install
npm run dev
```

Create or promote an admin account before signing in (from `functions`):

```bash
cd functions
npm run promote-admin -- --email you@example.com --password 'your-password'
```

Use `--emulator` when admin-web is pointed at the local emulators. Details: `admin-web/README.md`.

### 5. Firebase setup
- Configure a Firebase project with **Authentication** (email/password), **Firestore**, **Cloud Functions**, and **Cloud Storage**.
- Mobile Firebase config is shared from `mobile-app/src/services/firebaseConfig.ts`; native and web Auth initialization live in platform-specific service files.
- Enable the configured Firebase Storage bucket before uploading event images. The app accepts JPEG, PNG, and WebP files up to 5 MB; Storage rules restrict writes to the event host. Image picking uses the Expo SDK 56 `expo-image-picker` plugin and its photo permission text is configured in `mobile-app/app.json`. Rebuild the native development client after adding the picker.
- Storage rules read the event document in Firestore, so approve the Firebase prompt that grants Storage Rules access to the default Firestore database. Review `firebase/storage.rules`, then publish it to the intended test project with `firebase deploy --only storage --project <test-project-id>`. This work did not deploy to Firebase.
- Deploy Firestore rules/indexes and Cloud Functions before testing the live RSVP/payment flow.

### Preview data persistence

The mobile web preview currently uses the production Firebase project when `mobile-app/.env.local` has `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`. Successfully created accounts are stored in Firebase Authentication, and successfully created events/profiles are stored in Firestore. They remain in that project when the browser or local preview server closes; the preview server itself must be restarted to use the app again. EAS builds are not required for this persistence.

The admin web preview has its own Firebase setting in `admin-web/.env.local`. Both previews must target the same project to see the same accounts and events. Check these settings before testing: production writes affect real data, while emulator data is separate and never syncs to production. Never use real credentials in the demo emulator.

### Local emulator testing
Run the isolated Firebase Auth, Firestore, and Functions smoke tests from `functions`:

```bash
cd functions
npm run test:emulators
```

For local emulator-backed previews, set `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-popupgp`, and `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1` in `mobile-app/.env.local`. In `admin-web/.env.local`, set `VITE_USE_FIREBASE_EMULATORS=true`, `VITE_FIREBASE_PROJECT_ID=demo-popupgp`, and `VITE_FIREBASE_EMULATOR_HOST=127.0.0.1`. These app-specific files are ignored by Git; `.env.local` takes precedence over `.env`, so verify the values actually loaded by Expo/Vite before signup or event creation.

Then run `npm run serve` from `functions`, `npm run web` from `mobile-app`, and `npm run dev` from `admin-web` in separate terminals. The emulator runner explicitly uses the `demo-popupgp` project, imports saved Auth/Firestore data, and exports it when stopped cleanly. Stop it with **Ctrl+C** and wait for the export to finish. Data is restored next time the emulator starts. The `.firebase-emulator-data` folder is local-only, ignored by Git, and can be lost if the computer or disk fails; it is not an off-device backup.

The mobile web and admin web Firebase Auth clients persist their signed-in session in browser storage by default. Avoid clearing the browser's site data if you want to stay signed in. Local previews themselves are development servers: they stop when the computer shuts down, so restart the three commands above after turning it back on. They are not available while the computer is off.

The emulator runner explicitly uses the `demo-popupgp` demo project and never connects to the live Firebase project. To test Stripe checkout against Stripe test mode, copy `functions/.env.demo-popupgp.example` to `functions/.env.demo-popupgp` and replace both values with Stripe test keys. These local files are ignored by Git. For an Android emulator, set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=10.0.2.2` in `mobile-app/.env.local`; for a physical phone, use your computer's LAN IP. Do not put live Stripe secret keys in the app or commit local environment files.

### Production backups
`infrastructure/firestore-backups` is a draft opt-in plan for cloud backups. No production backup schedule or cross-project copy is active. Review its README and infrastructure configuration, confirm destination project, permissions and costs, and verify completed recovery tests before relying on backups. Local emulator exports are not production backups.

Firebase Auth, Cloud Storage files, security rules, and application configuration need separate recovery plans. Do not consider the complete system backed up until those plans are in place and tested.

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
  functions/          # Callable Firebase Cloud Functions
  shared/             # Shared TypeScript types
  admin-web/          # React/Vite admin console
  README.md
```

---

## App Flow

```
Splash screen
       â†“
Role picker â€” User or Host
       â†“
Login / Sign Up
       â†“
User â†’ Discover approved events â†’ View details â†’ RSVP / reserve ticket
       â†“
Host â†’ My events â†’ Create / edit / cancel / delete event
```

## Presentation Demo Flow

1. Start the mobile web preview from `mobile-app` and sign in with a prepared user or host account.
2. As a host, create an event with a future date, valid Gauteng coordinates, capacity, and a ticket price of zero for the web RSVP demo.
3. Start `admin-web`, sign in with an admin account, and approve the event.
4. Return to the mobile preview, refresh discovery, open the event, and RSVP.

Before presenting, confirm the accounts, Firebase project, deployed Firestore rules/indexes, and at least one approved demo event. For paid checkout, use an Android/iOS development build with deployed Functions and configured Stripe secrets. Hosts can add an optional image when creating or editing a pending event in a native development build; the browser preview displays image URLs already saved on events.

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

# During development â€” commit often
git add .
git commit -m "Description of what you built"

# Push and open a PR
git push --set-upstream origin feature/phase-N-short-name
# Go to github.com/lsdarchives/PopupGp â†’ open Pull Request â†’ merge to main
```

### Save changes to GitHub
```bash
git status
git add .
git commit -m "Describe your changes"
git push
```
- If this is the first push for a new branch, use `git push -u origin <branch-name>`.
- Then open the repo on GitHub and create a pull request.

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

## Current Implementation Status

### Phase 2 mobile app progress
- âœ… Host authentication flow and role-based navigation
- âœ… Event creation form with location, category, time, capacity, and ticket fields
- âœ… Host event list screen with status badges
- âœ… Event detail screen with edit, cancel, and delete actions
- âœ… User browse screen for approved events
- âœ… User event detail screen with RSVP and ticket reservation actions
- âœ… Firestore event status handling for `pending`, `approved`, `rejected`, and `cancelled`
- âœ… Firestore composite index deployed for approved-event queries

### Phase 4 mobile app progress
- ✅ User flow now lands on the map tab after splash/auth
- ✅ Map uses MapLibre with OpenFreeMap Positron tiles
- ✅ Search is focus-driven with compact filters and category chips
- ✅ Pin tap opens a preview card with image and CTA
- ✅ Bottom navigation icons are added

### Phase 5 mobile app progress
- ✅ Free RSVP and native paid-ticket checkout flows are implemented
- ✅ Event search with free, paid, and category filters
- ✅ Event images display in browse cards and map previews when an image URL exists

### Completed in the latest improvement phases
- ✅ Users can edit their display name; Profile links to Saved Events.
- ✅ Users can save or remove events from Browse and event details; Saved Events prunes events that are no longer upcoming and approved.
- ✅ Hosts can select, replace, or remove an optional event image while creating or editing an event.
- ✅ Storage rules restrict image uploads by event ownership, file type, and size; emulator checks cover upload/read access and denials.
- ✅ Functions build, mobile lint and TypeScript check, Expo config validation, and web export pass.

### Still to do before the presentation
- ⏳ Build or update the native development client, then manually test image selection and upload on an Android/iOS device against a Firebase test project.
- ⏳ Enable Storage and its Firestore Rules access in the test Firebase project; publish the reviewed Storage rules there if image upload will be part of the live demo. No live Firebase deployment has been made.
- ⏳ Complete the deployed-service RSVP and Stripe test-mode walkthrough, including payment success/failure, duplicate purchase, capacity, cancellation, and refund behavior. Use Stripe test credentials only; do not use live keys.
- ✅ Created `presentation/PopUpGp_IT_Project_700.pptx` with 13 slides, presenter notes, and local UI screenshots. Rehearse the demo with working test accounts and event data before presenting.

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 0 | Mobile shell + login | ✅ Done |
| 1 | Splash, role picker, register/login, Firestore rules | ✅ Done |
| 2 | Host event creation and management, user browse, RSVP/ticket flow | ✅ Core flows implemented; deployed-service verification remains |
| 3 | React/Vite admin web — approve/reject events | ✅ Done |
| 4 | Uber-style map for users | ✅ Done |
| 5 | RSVP, filters, profiles, images | ✅ Core flows and emulator checks complete; native device and deployed-service verification remain |
| 6 | Docs, README, presentation deck, demo script | ✅ Deck created; demo rehearsal remains |

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
