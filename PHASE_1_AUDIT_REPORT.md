# Phase 1 Audit Report

## Audit summary

The PopUpGP codebase is structured around a Firebase-first model with a mobile application for users and hosts, and a separate admin web console for event approval. The review focused on major user journeys: auth, profile, mobile event creation, host management, admin moderation, and app navigation.

## Findings

### Critical

- Event creation could report success even when the image upload failed. Root cause: the code set `formSuccess` in the upload error catch path instead of an error state.
- Validation of the actual result must be tied to the backend outcome rather than assuming the event was created successfully.

### High

- Host/user navigation depends on the Firestore `role` value matching the expected `user` or `host` values.
- Any incomplete or missing user profile document can block access and redirect the user to an error state.

### Medium

- Several flows are reliant on Firestore and Storage being correctly configured in the active environment.
- Empty states and loading states are implemented well, but they should be checked end-to-end with emulator or live Firebase data.

### Low

- Some placeholder messaging should be reviewed for consistency in production.

## Files reviewed

- `mobile-app/src/app/(host)/create-event.tsx`
- `mobile-app/src/services/events.ts`
- `mobile-app/src/services/event-images.ts`
- `mobile-app/src/app/(auth)/login.tsx`
- `mobile-app/src/contexts/AuthContext.tsx`
- `mobile-app/src/utils/navigation.ts`
- `admin-web/src/App.tsx`

## Recommendation

Prioritise correctness of event submission and role-based navigation before broader UX polish. Once those flows are stable, the remaining work becomes production hardening rather than feature implementation.
