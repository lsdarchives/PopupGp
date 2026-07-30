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
- Dashboard, analytics, and profile views

## Admin setup

1. Register a normal account in the mobile app or Firebase Auth
2. Create the matching Firestore `users/{uid}` document
3. Change the document `role` field to `admin`
4. Sign in to the admin console with that account

## Notes

- The app reads from the same Firebase project as the mobile app
- Event moderation follows the Firestore security rules in `firebase/firestore.rules`
- If the console says access is denied, check the Firebase Auth account and `users/{uid}.role`
