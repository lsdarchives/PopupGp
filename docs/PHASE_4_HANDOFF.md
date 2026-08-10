# Phase 4 Handoff

## What Is Done

- Branch: `feature/phase-4-user-map`
- User flow now lands on the map first after splash/auth
- User navigation has tabs for `Map`, `Browse`, and `Profile`
- Map screen uses MapLibre with OpenFreeMap Positron tiles and custom pins
- The two bottom info cards were removed; the map is now cleaner and more open
- Profile screen shows the signed-in user and logout shortcut
- TypeScript check passes with `cd mobile-app && npx.cmd tsc --noEmit`
- No Google Maps key is required for the current map implementation
- Phase 4 is complete and pushed to `origin/feature/phase-4-user-map`

## What To Do Next Time

1. Switch to `feature/phase-4-user-map`
2. Run `cd mobile-app`
3. Run `npm start` or `npx expo start`
4. Open the user flow and confirm the map tab is the landing screen
5. Open an approved event from map or browse and confirm the detail screen
6. If you only need the current build, move on to `feature/phase-5-rsvp-and-polish`

## Remaining Phase 5 Work

- Search and filter the user discovery flow
- Add past events / richer discovery polish
- Expand the user experience around RSVP and paid ticket purchase
- Add profile editing and saved user preferences
- Polish event images, cards, and CTA flow
- Tighten the browse/search experience for RSVP-first usage

## Notes

- The user home route now points to the map tab
- Event detail still lives under the user stack and is shared by map and browse
- The route type cache may need a fresh Expo start if it lags behind new files
- MapLibre requires a dev-client rebuild after native dependency changes
