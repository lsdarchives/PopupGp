# Phase 2 Implementation Report

## Scope

This phase focused on the core event creation and host submission flow. The key objective was to ensure the application reflects actual backend outcomes and does not display a success message when submission fails.

## Issue fixed

### Event creation success state after image upload failure

File changed:
- `mobile-app/src/app/(host)/create-event.tsx`

Root cause:
- The create-event flow created the Firestore document before uploading the image.
- When the image upload or Storage update failed, the code set a success message instead of an error state.

Fix implemented:
- The application now clears the success state and sets a real error message when image upload fails.
- The user now sees an accurate status message instead of a false success confirmation.
- The event remains in the pending state without incorrectly claiming that the submission succeeded.

## Validation

Executed:
- `cd C:\Dev\Popup-ITProject\PopupGp\mobile-app; npx tsc --noEmit`
- `cd C:\Dev\Popup-ITProject\PopupGp\admin-web; npm run build`

Result:
- Both the mobile app and admin web app type-check/build successfully.

## Outcome

The end-to-end host submission experience is now more reliable: failed image uploads no longer produce false success notifications, and the app reports the real state to the organiser.
