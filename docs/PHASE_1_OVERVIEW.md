# Phase 1 — Auth Foundation (Overview)

## What was built

Phase 1 adds a solid authentication and data foundation before events or maps.

### Mobile app (`mobile-app/`)

| Feature | Description |
|---------|-------------|
| **Auth persistence** | Firebase Auth uses AsyncStorage — login survives app restarts |
| **Register screen** | Sign up with display name, email, password, and role (Event goer / Event host) |
| **AuthProvider** | Central session context (`user`, `profile`, `loading`, `logout`) |
| **Loading gate** | `index.tsx` shows a spinner while auth resolves |
| **Logout** | Log out button on browse and my-events screens |
| **Admin guard** | Admin accounts are blocked on mobile with a message |
| **User service** | `getUserProfile` / `createUserProfile` for Firestore `users` collection |

### Shared types (`shared/types/`)

- `UserRole`, `UserProfile` — used by mobile now, admin web in Phase 3
- `Event`, `EventStatus`, `EventLocation` — schema ready for Phase 2+

### Firebase (`firebase/`)

- `firestore.rules` — security rules for `users`, `events`, `rsvps`
- `firestore.indexes.json` — composite indexes for event queries
- `firebase.json` — config for deploying rules via Firebase CLI

## Firestore `users` document shape

```json
{
  "email": "user@example.com",
  "displayName": "Jane",
  "role": "user",
  "createdAt": "<timestamp>"
}
```

Roles: `user` | `host` | `admin` (admin set manually in Firebase Console for now)

## New / updated files

```
PopupGp/
  docs/PHASE_1_OVERVIEW.md          ← this file
  firebase/
    firestore.rules
    firestore.indexes.json
  firebase.json
  shared/types/
    user.ts, event.ts, index.ts
  mobile-app/src/
    contexts/AuthContext.tsx
    components/logout-button.tsx
    services/users.ts
    types/index.ts
    utils/navigation.ts
    app/_layout.tsx                   (wraps AuthProvider)
    app/index.tsx                     (loading + routing)
    app/(auth)/register.tsx           (full registration)
    app/(auth)/login.tsx              (updated)
    app/(user)/browse.tsx             (logout + greeting)
    app/(host)/my-events.tsx          (logout + greeting)
    services/firebase.ts              (AsyncStorage persistence)
```

## How to test

1. Start the app: `cd mobile-app` → `npx expo start --dev-client`
2. **Register** as Event goer → lands on Browse screen with your name
3. **Log out** → returns to login
4. **Register** as Event host → lands on My Events
5. **Close and reopen app** → should stay logged in (persistence)
6. **Login** with existing account

## Deploy Firestore rules (required for register to work)

Rules are in the repo but must be deployed to Firebase:

```powershell
# Install Firebase CLI once: npm install -g firebase-tools
cd C:\Dev\Popup-ITProject\PopupGp
firebase login
firebase use popupgp-b987c
firebase deploy --only firestore:rules,firestore:indexes
```

Until rules are deployed, registration may fail with permission errors if default rules deny writes.

## Creating an admin user (for Phase 3)

1. Register a normal account in the app
2. In [Firebase Console](https://console.firebase.google.com) → Firestore → `users/{uid}`
3. Change `role` from `user` or `host` to `admin`

## Phase 1 done checklist

- [x] Register with user/host role
- [x] Login / logout
- [x] Session persists after app restart
- [x] Firestore rules in repo
- [x] Shared types for users and events
- [ ] Rules deployed to Firebase (manual step)
- [ ] PR merged to `main`

## Next: Phase 2

Host event creation — create event form, `events` collection, my-events list with pending/approved status.
