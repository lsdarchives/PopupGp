# Phase 3 Handoff

## What Is Done

- Branch: `feature/phase-3-admin-web`
- Admin web console is built in `admin-web/`
- Firebase Auth sign-in works for admin users
- Firestore event moderation works: approve, reject, cancel
- Build check passes with `cd admin-web && npm run build`

## What To Do Next Time

1. Switch to `feature/phase-3-admin-web`
2. Run `cd admin-web`
3. Run `npm install`
4. Run `npm run dev`
5. Sign in with an admin account
6. Test the event queue against a real pending host event

## Remaining Phase 3 Work

- Deploy the admin web app if you want it online
- Do final polish on the admin UI
- Confirm the moderation flow end to end on a real device/browser

## Notes

- The admin account must have `users/{uid}.role = admin`
- The repo currently has local-only root install files that are not part of the phase 3 branch
- Phase 4 and later are still pending in the main README
