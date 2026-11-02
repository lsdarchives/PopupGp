# Five-minute live demo

Run each command in its own PowerShell terminal, from `C:\Dev\Popup-ITProject\PopupGp`.

The goal is to show one complete **free-event** lifecycle: host submission → admin approval → attendee RSVP. It proves that the three applications share the same Firebase emulator data. This is a local demo only; it does not change or back up production.

## Terminal 1 — start Firebase once

```powershell
cd functions
npm run serve
```

Leave this terminal running. It starts the local Auth, Firestore, Functions, and Storage emulators shared by both apps.

The emulator imports `.firebase-emulator-data` when a saved export exists and exports data when it exits. Keep the emulator terminal open during the presentation. If you stop it afterward, wait for the export to finish before closing the terminal.

## Terminal 2 — start the attendee and host web app

```powershell
cd mobile-app
npx expo start --web --port 8083
```

Open [http://localhost:8083](http://localhost:8083).

## Terminal 3 — start the admin web app

```powershell
cd admin-web
npm run dev -- --port 5174
```

Open [http://localhost:5174](http://localhost:5174).

## Demo order (60–90 seconds)

Use these local emulator accounts:

| Role | Email | Password |
|---|---|---|
| Host | `demo.host@example.com` | `HostDemo2026!` |
| Admin | `demo.admin@example.com` | `PopupGPdemo2026!` |
| Attendee | `demo.attendee@example.com` | `AttendeeDemo2026!` |

1. In the mobile web app, sign in as the host and show the prepared events. To demonstrate submission, open **Create Event** and submit an event.
2. Use a clear title, a future start date, a Gauteng venue, valid latitude/longitude, capacity, and ticket price **0**. Keep it free because this browser demo uses free RSVP.
3. In the admin web app, sign in as the admin and open **Events**. Approve a pending event or show the prepared approval state.
4. In the mobile web app, sign out, choose **Attendee**, sign in, then open **Browse**.
5. Open **Victoria Yards Makers Market** and show the RSVP confirmation and guest count. The current prepared dataset has 3 events, 2 approved, 1 pending, and 1 RSVP.

Prepared fallback events:

- **Victoria Yards Makers Market** — approved, free, 1 RSVP.
- **Zoo Lake Community Picnic** — approved, free.
- **Braamfontein Makers Market** — pending review.

Keep the demonstration focused: do not edit, cancel, upload an image, or start paid checkout unless you have separately tested those flows in the correct environment.

## Before presenting

- Confirm `mobile-app/.env.local` and `admin-web/.env.local` use `demo-popupgp` with Firebase emulators enabled.
- Restart the mobile and admin web servers after changing either environment file.
- Confirm the prepared events and accounts still appear after emulator startup; the emulator imports `.firebase-emulator-data`.
- Keep the computer awake and all three terminals running. Local emulator and preview services stop if their processes or the computer stop.
- Do not demonstrate Stripe in the browser: paid checkout requires a native development build and Stripe test credentials.

The saved emulator export is a presentation recovery point only. It is not the requested production disaster-recovery backup. The full Firestore + Auth metadata + Storage backup workflow remains deferred until after the presentation.

## If something goes wrong

- **A port is already in use:** choose a free port for Expo or Vite, then use the URL it prints.
- **Login fails after restarting emulators:** confirm the emulator imported `.firebase-emulator-data`; otherwise recreate the local accounts. The admin profile must have Firestore role `admin`.
- **The event does not appear in Browse:** confirm that the admin approved it, the start date is still in the future, and refresh the attendee app. Use the prepared approved event if needed.
- **The live flow fails:** show the implementation screenshots in the presentation and explain the verified emulator smoke-test coverage for free RSVP and capacity. Do not claim the failed action succeeded.
