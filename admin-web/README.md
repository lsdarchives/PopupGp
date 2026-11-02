# PopupGP Admin Console

Phase 3 of the PopupGP project is the admin web app used to review host submissions and approve or reject events in Firestore.

## Run locally

```bash
cd admin-web
npm install
npm run dev
```

## What it does

- Firebase Auth sign-in for admin users
- Live Firestore queue for submitted events
- Approve, reject, or cancel event requests
- Overview dashboard, event analytics, and profile views
- Admin sign-in and dashboard styled for desktop and mobile
- Download an all-events CSV report from the analytics view

## Admin setup

Preferred: create or promote an admin with the script in `functions` (uses Firebase Admin SDK).

**Production** (same live project as `VITE_USE_FIREBASE_EMULATORS=false`):

```bash
cd ../functions
# Use a service account JSON, or: gcloud auth application-default login
npm run promote-admin -- --email you@example.com --password 'your-password'
```

**Emulator** (Auth + Firestore emulators must already be running):

```bash
cd ../functions
npm run promote-admin -- --emulator --email you@example.com --password 'your-password'
```

Then sign in to this console with that email and password. Confirm mobile and admin share the same Firebase project / emulator flags in their `.env.local` files.

Manual Console alternative:

1. Register a normal account in the mobile app or Firebase Auth
2. Create the matching Firestore `users/{uid}` document
3. Change the document `role` field to `admin`
4. Sign in to the admin console with that account

## Notes

- The app reads from the same Firebase project as the mobile app
- Event moderation follows the Firestore security rules in `firebase/firestore.rules`
- CSV reports contain event IDs, status, category, venue, dates, RSVP counts, capacity, and ticket price; they do not include host account identifiers
- If sign-in fails, check the on-screen message: wrong password vs missing profile vs `users/{uid}.role` not `admin`. Fix with `npm run promote-admin` in `functions`.
