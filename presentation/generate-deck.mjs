import pptxgen from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'PopUpGp Project Team';
pptx.subject = 'IT Project 700 — product, architecture, implementation and verification';
pptx.title = 'PopUpGp — Where the city comes alive';
pptx.company = 'PopUpGp';
pptx.lang = 'en-ZA';
pptx.theme = {
  headFontFace: 'Manrope',
  bodyFontFace: 'Inter',
  lang: 'en-ZA',
};
pptx.defineSlideMaster({
  title: 'CONTENT',
  background: { color: 'F7F5F2' },
  objects: [
    { rect: { x: 0.55, y: 0.42, w: 0.11, h: 0.35, line: { color: 'E8152A', transparency: 100 }, fill: { color: 'E8152A' } } },
    { text: { text: 'POPUPGP  /  IT PROJECT 700', options: { x: 0.78, y: 0.42, w: 5.7, h: 0.25, margin: 0, fontFace: 'Inter', fontSize: 9, bold: true, charSpacing: 1.2, color: '64666B' } } },
    { line: { x: 0.55, y: 7.06, w: 12.2, h: 0, line: { color: 'E5E1DC', width: 0.7 } } },
    { text: { text: 'Where the city comes alive', options: { x: 0.55, y: 7.13, w: 5.3, h: 0.19, margin: 0, fontFace: 'Inter', fontSize: 8, color: '64666B' } } },
  ],
  slideNumber: { x: 12.25, y: 7.1, w: 0.45, h: 0.2, color: '64666B', fontFace: 'Inter', fontSize: 8 },
});

const C = {
  red: 'E8152A', dark: '202124', bg: 'F7F5F2', white: 'FFFFFF', gray: '64666B',
  border: 'E5E1DC', tint: 'FCE9EC', green: '217A50', amber: '865700', blueGray: '5A6572',
  pale: 'F1EDE8', ink2: '33363A',
};
const HEAD = 'Manrope';
const BODY = 'Inter';
const ST = pptx.ShapeType;

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h, margin: 0, fontFace: opts.fontFace ?? BODY,
    fontSize: opts.fontSize ?? 14, color: opts.color ?? C.dark,
    bold: opts.bold ?? false, breakLine: false, valign: opts.valign ?? 'mid',
    align: opts.align ?? 'left', fit: 'shrink', paraSpaceAfterPt: 0,
    charSpacing: opts.charSpacing, bullet: opts.bullet, italic: opts.italic,
    transparency: opts.transparency, isTextBox: true,
  });
}
function box(slide, x, y, w, h, fill = C.white, line = C.border, radius = true) {
  slide.addShape(radius ? ST.roundRect : ST.rect, {
    x, y, w, h, rectRadius: 0.12,
    line: { color: line, width: 0.8 }, fill: { color: fill },
    radius: 0.12,
  });
}
function tag(slide, value, x, y, w, fill = C.tint, color = C.red) {
  slide.addShape(ST.roundRect, { x, y, w, h: 0.34, rectRadius: 0.1, line: { color: fill, transparency: 100 }, fill: { color: fill } });
  text(slide, value, x + 0.12, y + 0.035, w - 0.24, 0.24, { fontSize: 9, color, bold: true, align: 'center' });
}
function heading(slide, title, subtitle) {
  text(slide, title, 0.65, 0.98, 11.9, 0.6, { fontFace: HEAD, fontSize: 27, bold: true });
  if (subtitle) text(slide, subtitle, 0.68, 1.65, 11.7, 0.42, { fontSize: 12, color: C.gray });
}
function bullet(slide, title, description, x, y, w, color = C.red) {
  slide.addShape(ST.ellipse, { x, y: y + 0.07, w: 0.14, h: 0.14, line: { color, transparency: 100 }, fill: { color } });
  text(slide, title, x + 0.28, y, w - 0.28, 0.29, { fontFace: HEAD, fontSize: 14, bold: true });
  text(slide, description, x + 0.28, y + 0.32, w - 0.28, 0.52, { fontSize: 10.5, color: C.gray, valign: 'top' });
}
function screenshot(slide, name, x, y, w, h) {
  const p = path.join(here, 'screenshots', name);
  slide.addShape(ST.roundRect, { x: x - 0.08, y: y - 0.08, w: w + 0.16, h: h + 0.16, rectRadius: 0.12, line: { color: C.border, width: 1 }, fill: { color: C.white } });
  slide.addImage({ path: p, x, y, w, h });
}
function note(slide, content) { slide.addNotes(content); }

// 1 — Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  s.addShape(ST.rect, { x: 0, y: 0, w: 0.18, h: 7.5, line: { color: C.red, transparency: 100 }, fill: { color: C.red } });
  tag(s, 'IT PROJECT 700', 0.75, 0.7, 1.7, C.red, C.white);
  text(s, 'PopUpGp', 0.75, 1.45, 6.6, 0.9, { fontFace: HEAD, fontSize: 46, bold: true, color: C.white });
  text(s, 'Where the city comes alive', 0.8, 2.45, 6.3, 0.55, { fontFace: HEAD, fontSize: 22, color: 'F6DDE0', bold: true });
  text(s, 'A Gauteng pop-up events platform for discovery, hosting and moderation.', 0.8, 3.25, 5.8, 0.8, { fontSize: 17, color: 'E3E0DC', valign: 'top' });
  text(s, '12–15 minute project presentation', 0.8, 6.5, 4.2, 0.3, { fontSize: 11, color: 'C4C0BB' });
  s.addShape(ST.roundRect, { x: 8.25, y: 0.55, w: 3.6, h: 6.35, rectRadius: 0.25, line: { color: '55585D', width: 1.4 }, fill: { color: '17181A' } });
  s.addImage({ path: path.join(here, 'screenshots', '01-role-selection.png'), x: 8.4, y: 0.75, w: 3.3, h: 5.95 });
  text(s, 'DISCOVER  •  HOST  •  MODERATE', 7.72, 7.08, 4.8, 0.2, { fontSize: 9, color: 'D3CFCA', bold: true, align: 'center', charSpacing: 0.8 });
  note(s, 'Welcome the audience. PopUpGp is a mobile-first platform focused on finding and running local pop-up events in Gauteng. The presentation covers the user journeys, system design, security boundaries, and what has been verified. Mention that the slide deck uses the project’s red, warm neutral, Manrope and Inter visual system.');
}

// 2 — Purpose
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'The idea: make local events easier to find and run', 'Product intent, not a claim of completed market research');
  box(s, 0.68, 2.35, 3.82, 3.35, C.white);
  box(s, 4.76, 2.35, 3.82, 3.35, C.white);
  box(s, 8.84, 2.35, 3.82, 3.35, C.white);
  tag(s, 'ATTENDEES', 0.98, 2.68, 1.25);
  text(s, 'Find something nearby', 0.98, 3.23, 3.2, 0.55, { fontFace: HEAD, fontSize: 19, bold: true });
  text(s, 'Browse approved events, check details, save favourites and RSVP.', 0.98, 4.02, 3.0, 0.85, { fontSize: 13, color: C.gray, valign: 'top' });
  tag(s, 'HOSTS', 5.06, 2.68, 0.9);
  text(s, 'Publish with confidence', 5.06, 3.23, 3.1, 0.55, { fontFace: HEAD, fontSize: 19, bold: true });
  text(s, 'Create and manage an event with venue, schedule, capacity, price and an optional photo.', 5.06, 4.02, 3.0, 1.0, { fontSize: 13, color: C.gray, valign: 'top' });
  tag(s, 'ADMINS', 9.14, 2.68, 0.92);
  text(s, 'Keep listings trustworthy', 9.14, 3.23, 3.1, 0.55, { fontFace: HEAD, fontSize: 19, bold: true });
  text(s, 'Review submitted events and move them through approval, rejection or cancellation.', 9.14, 4.02, 3.0, 0.9, { fontSize: 13, color: C.gray, valign: 'top' });
  text(s, 'One workflow connects discovery → event operations → moderation.', 0.75, 6.15, 11.4, 0.42, { fontFace: HEAD, fontSize: 17, bold: true, color: C.red, align: 'center' });
  note(s, 'Introduce the three users and their need. Explain the design objective: put local discovery, host operations and moderation into one consistent workflow. The cards describe the intended product roles and implemented feature areas. They should not be presented as findings from a user study; no user research data is claimed here.');
}

// 3 — Role journey
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Three roles, one event lifecycle', 'Access is shaped by the role stored in the user profile');
  const xs = [0.82, 4.92, 9.02];
  const titles = ['Attendee', 'Host', 'Admin'];
  const subs = ['Discover & RSVP', 'Create & manage', 'Review & moderate'];
  const details = [
    ['Approved listings', 'Event details & saved events', 'Free RSVP / paid ticket path'],
    ['Event form & venue details', 'Capacity, schedule & price', 'My Events, edit and cancel'],
    ['Moderation dashboard', 'Approve or reject submissions', 'Status and analytics views'],
  ];
  for (let i = 0; i < 3; i += 1) {
    box(s, xs[i], 2.45, 3.5, 3.55, C.white);
    s.addShape(ST.ellipse, { x: xs[i] + 0.25, y: 2.75, w: 0.55, h: 0.55, line: { color: C.tint, transparency: 100 }, fill: { color: C.tint } });
    text(s, String(i + 1).padStart(2, '0'), xs[i] + 0.25, 2.86, 0.55, 0.24, { fontSize: 11, color: C.red, bold: true, align: 'center' });
    text(s, titles[i], xs[i] + 0.25, 3.55, 3.0, 0.42, { fontFace: HEAD, fontSize: 22, bold: true });
    tag(s, subs[i], xs[i] + 0.25, 4.02, 1.9, i === 2 ? 'E8EEE9' : C.tint, i === 2 ? C.green : C.red);
    details[i].forEach((d, j) => bullet(s, d, '', xs[i] + 0.28, 4.58 + j * 0.42, 2.95));
  }
  text(s, 'SUBMIT', 3.72, 3.1, 0.8, 0.25, { fontSize: 9, bold: true, color: C.gray, align: 'center' });
  text(s, 'REVIEW', 7.82, 3.1, 0.8, 0.25, { fontSize: 9, bold: true, color: C.gray, align: 'center' });
  text(s, 'An approved event becomes discoverable; RSVP and ticket records are written server-side.', 1.0, 6.42, 11.3, 0.3, { fontSize: 12, color: C.gray, align: 'center' });
  note(s, 'Walk from left to right. Attendees browse and act on approved events. Hosts submit and maintain their own events. Admins review status. The lifecycle is enforced with role-aware Firestore rules and callable Functions for RSVP/payment actions. Mention that the admin web console is a separate React/Vite application, while attendee and host experiences use Expo Router.');
}

// 4 — User discovery UI
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Discovery is built around a quick decision', 'Browse combines a featured area, search, event cards and map/list navigation');
  screenshot(s, '02-user-browse.png', 0.82, 2.18, 2.75, 4.35);
  bullet(s, 'Featured event carousel', 'Up to five nearest upcoming approved events with photos; branded fallback if none qualify.', 4.05, 2.45, 7.8);
  bullet(s, 'Useful discovery controls', 'Search by event, category or place, with clear approved-only results.', 4.05, 3.55, 7.8);
  bullet(s, 'Map and list paths', 'Native MapLibre pins open a preview card; web uses a list-based fallback.', 4.05, 4.65, 7.8);
  tag(s, 'CAPTURED FROM LOCAL WEB PREVIEW', 4.05, 5.82, 2.8, 'F1EDE8', C.gray);
  text(s, 'Preview data query showed an emulator listing error; see demo fallback in notes.', 4.05, 6.25, 7.7, 0.35, { fontSize: 10, color: C.amber, italic: true });
  note(s, 'This is an actual screenshot from the local browser preview. The discovery UI is visible, but the local emulator-backed query displayed an error (“false for list”); do not describe this capture as a successful event fetch. For a live demo, verify the approved event query against the prepared test data first. If the error persists, show the role flow and host form, then explain the discovery UI using the screenshot. The native map is not shown in the web build.');
}

// 5 — Host creation
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Hosts can create an event without guessing coordinates', 'A guided form brings venue, timing, capacity and ticket details together');
  screenshot(s, '05-host-create-event.png', 0.85, 2.05, 2.4, 4.85);
  bullet(s, 'Venue support', 'Enter an address and open Google Maps to find the pin and copy latitude/longitude.', 3.85, 2.38, 8.1);
  bullet(s, 'Schedule controls', 'Date and time fields use platform-specific pickers; web shows browser-native inputs.', 3.85, 3.42, 8.1);
  bullet(s, 'Event operations', 'Choose category, define capacity and a ZAR price, then track approval in My Events.', 3.85, 4.46, 8.1);
  bullet(s, 'Optional photo', 'One image per event; JPEG, PNG or WebP up to 5 MB, with host-only Storage rules.', 3.85, 5.5, 8.1);
  text(s, 'Image picker requires a native development build. The web preview accepts the core form.', 3.85, 6.62, 8.2, 0.28, { fontSize: 9.5, color: C.gray, italic: true });
  note(s, 'Point to the form fields. Hosts provide title, description, category, venue and coordinates, start time, capacity and price. If coordinates are not known, use the Google Maps action to find a pin and copy the coordinates. The optional event image flow uses Expo ImagePicker and Firebase Storage and requires a rebuilt native development client. Storage rules have been reviewed but not deployed to a live Firebase project.');
}

// 6 — Moderation
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Moderation is the quality gate', 'The admin console reviews submissions before they appear in discovery');
  box(s, 0.78, 2.25, 7.15, 4.2, C.white);
  text(s, 'MODERATION QUEUE  /  SCHEMATIC', 1.1, 2.55, 4.2, 0.24, { fontSize: 9, color: C.gray, bold: true, charSpacing: 0.8 });
  text(s, 'Pending events', 1.1, 2.96, 5.2, 0.48, { fontFace: HEAD, fontSize: 23, bold: true });
  const rows = [
    ['Weekend Makers Market', 'Markets  ·  Gauteng', 'PENDING'],
    ['Sunset Jazz in the Park', 'Music  ·  Johannesburg', 'PENDING'],
    ['Community Food Pop-up', 'Food  ·  Pretoria', 'APPROVED'],
  ];
  rows.forEach((row, i) => {
    const y = 3.7 + i * 0.8;
    s.addShape(ST.line, { x: 1.1, y: y - 0.13, w: 6.5, h: 0, line: { color: C.border, width: 0.7 } });
    text(s, row[0], 1.12, y, 3.4, 0.27, { fontFace: HEAD, fontSize: 12, bold: true });
    text(s, row[1], 1.12, y + 0.31, 3.8, 0.22, { fontSize: 9, color: C.gray });
    tag(s, row[2], 5.4, y + 0.07, 1.3, row[2] === 'APPROVED' ? 'E8EEE9' : 'F8F0DF', row[2] === 'APPROVED' ? C.green : C.amber);
  });
  bullet(s, 'Review', 'Inspect event details and image before taking action.', 8.4, 2.7, 4.0);
  bullet(s, 'Decide', 'Approve, reject or cancel within permitted status transitions.', 8.4, 3.85, 4.0);
  bullet(s, 'Track', 'Dashboard and analytics provide an overview of platform activity.', 8.4, 5.0, 4.0);
  text(s, 'Admin panel: React + Vite  ·  Authenticated role: admin', 8.4, 6.28, 4.1, 0.34, { fontSize: 10, color: C.gray });
  note(s, 'This panel is a schematic illustration, not a screenshot of a populated moderation queue. The actual admin console is implemented in React and Vite with sign-in, event moderation, analytics and profile screens. Event rules limit admins to valid status transitions. A fresh isolated preview showed an auth-loading state, so demo the real moderation flow only after the admin emulator account and emulator config are ready.');
}

// 7 — Architecture
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Architecture keeps client actions behind clear services', 'Mobile and admin clients share Firebase identity and data; sensitive operations go through Functions');
  const nodes = [
    { x: 0.85, y: 2.35, w: 3.05, h: 1.05, title: 'Expo 56 app', sub: 'Attendee + Host · iOS / Android / Web', fill: C.white },
    { x: 0.85, y: 4.45, w: 3.05, h: 1.05, title: 'React + Vite admin', sub: 'Moderation · Analytics · Profile', fill: C.white },
    { x: 5.1, y: 2.35, w: 3.1, h: 1.05, title: 'Firebase Auth', sub: 'Identity + role profile', fill: C.tint },
    { x: 5.1, y: 4.05, w: 3.1, h: 1.05, title: 'Cloud Firestore', sub: 'Users · Events · RSVPs · Saves', fill: C.tint },
    { x: 9.45, y: 2.35, w: 3.0, h: 1.05, title: 'Cloud Functions', sub: 'RSVP + ticket confirmation', fill: C.white },
    { x: 9.45, y: 4.05, w: 3.0, h: 1.05, title: 'Stripe + Storage', sub: 'Native checkout · Event images', fill: C.white },
  ];
  nodes.forEach(n => { box(s, n.x, n.y, n.w, n.h, n.fill); text(s, n.title, n.x + 0.18, n.y + 0.2, n.w - 0.36, 0.28, { fontFace: HEAD, fontSize: 15, bold: true }); text(s, n.sub, n.x + 0.18, n.y + 0.57, n.w - 0.36, 0.25, { fontSize: 9, color: C.gray }); });
  [['Client → Auth', 3.95, 2.76], ['Admin → Auth', 3.95, 4.85], ['Auth → Data', 8.25, 3.72], ['Data → Functions', 8.25, 4.78], ['Functions → Stripe', 10.82, 3.49]].forEach(([label,x,y]) => { text(s, '→', Number(x), Number(y), 0.38, 0.3, { fontFace: HEAD, fontSize: 21, color: C.red, bold: true, align: 'center' }); });
  text(s, 'Native map: MapLibre + OpenFreeMap  |  Browser map fallback: event list', 1.1, 6.1, 11.2, 0.4, { fontSize: 11, color: C.gray, align: 'center' });
  note(s, 'Explain the two front ends and shared Firebase services. Firebase Authentication gives the user identity; role lives in the user document. Firestore stores events, RSVPs and saved-event references. Callable Functions own free RSVP mutations and paid-ticket creation/confirmation. Stripe secrets stay in Functions. Event image files are stored in Firebase Storage; the app has a web list fallback and native map.');
}

// 8 — Security
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Security follows ownership and role boundaries', 'The client can request actions, but rules and Functions decide whether they are allowed');
  const cols = [0.85, 3.95, 7.05, 10.15];
  const rows = [
    ['PROFILE', 'Owner edits display name', 'Email and role protected', 'Admin role controlled'],
    ['EVENTS', 'Host creates/edits own', 'Admin changes valid status', 'Approved listings readable'],
    ['RSVP', 'Client cannot write RSVP', 'Callable checks status/capacity', 'Count updated transactionally'],
    ['IMAGES', 'Host uploads to own event', 'Image type + 5 MB limit', 'Replace/delete cleanup hooks'],
  ];
  rows.forEach((r, i) => {
    const y = 2.42 + i * 0.9;
    box(s, 0.78, y, 11.8, 0.73, i === 0 ? C.tint : C.white);
    text(s, r[0], cols[0], y + 0.21, 2.6, 0.25, { fontSize: 9, bold: true, color: C.red, charSpacing: 0.7 });
    text(s, r[1], cols[1], y + 0.16, 2.8, 0.39, { fontSize: 10 });
    text(s, r[2], cols[2], y + 0.16, 2.8, 0.39, { fontSize: 10 });
    text(s, r[3], cols[3], y + 0.16, 2.2, 0.39, { fontSize: 10 });
  });
  tag(s, 'RULES + SERVER CHECKS', 4.55, 6.3, 2.55, C.dark, C.white);
  note(s, 'Describe the security model in plain language. Firestore rules restrict profile edits to displayName and stop direct RSVP writes. Hosts can edit their own event documents while admin status changes are limited. The Functions layer checks approval, price and capacity and applies RSVP count changes transactionally. Storage rules scope uploads to the host, check image content type and size, and Functions clean replaced or deleted images. Emulator tests have covered profile, saved-event ownership, event creation/moderation, RSVP write denial and Storage rule behavior.');
}

// 9 — RSVP
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Free RSVP is a reversible, capacity-aware action', 'One server transaction keeps the attendee record and event count in sync');
  const labels = ['User taps RSVP', 'Function checks event', 'Capacity checked', 'RSVP + count saved'];
  labels.forEach((label, i) => {
    const x = 0.86 + i * 3.12;
    box(s, x, 2.65, 2.55, 1.0, i === 3 ? 'E8EEE9' : C.white);
    text(s, `0${i + 1}`, x + 0.16, 2.82, 0.38, 0.22, { fontSize: 10, bold: true, color: C.red });
    text(s, label, x + 0.16, 3.15, 2.2, 0.32, { fontFace: HEAD, fontSize: 12, bold: true, align: 'center' });
    if (i < 3) text(s, '→', x + 2.62, 2.97, 0.42, 0.3, { fontSize: 22, color: C.red, bold: true, align: 'center' });
  });
  box(s, 1.15, 4.35, 5.15, 1.55, C.white);
  box(s, 6.95, 4.35, 5.15, 1.55, C.white);
  tag(s, 'EMULATOR VERIFIED', 1.48, 4.62, 1.85, 'E8EEE9', C.green);
  text(s, 'Join · cancel · rejoin', 1.48, 5.05, 4.2, 0.34, { fontFace: HEAD, fontSize: 16, bold: true });
  text(s, 'Smoke test confirms count changes and no over-capacity RSVP.', 1.48, 5.48, 4.3, 0.25, { fontSize: 10, color: C.gray });
  tag(s, 'PROTECTED', 7.28, 4.62, 1.25, C.tint, C.red);
  text(s, 'No direct RSVP writes', 7.28, 5.05, 4.2, 0.34, { fontFace: HEAD, fontSize: 16, bold: true });
  text(s, 'Paid tickets cannot be cancelled with the free RSVP action.', 7.28, 5.48, 4.3, 0.25, { fontSize: 10, color: C.gray });
  note(s, 'This flow is verified by the existing Functions emulator smoke test. It checks that direct RSVP writes are denied; an authenticated callable can add, cancel and re-add a free RSVP; capacity is enforced; and a failed full-capacity request does not change the count. It also verifies that a paid ticket is not removed by the free RSVP cancellation path. This is emulator verification, not a deployed-service test.');
}

// 10 — Stripe
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'Paid tickets use native Stripe checkout', 'The backend confirms payment before a ticket is recorded');
  box(s, 0.82, 2.35, 7.45, 3.75, C.white);
  const steps = [
    ['1', 'Create PaymentIntent', 'Server checks event, duplicate ticket, capacity and ZAR amount.'],
    ['2', 'Collect payment', 'Stripe PaymentSheet runs in the iOS / Android app.'],
    ['3', 'Confirm and fulfill', 'Server retrieves Stripe status and validates metadata and price.'],
    ['4', 'Recover safely', 'On unfulfillable success, issue an idempotent refund or a clear support error.'],
  ];
  steps.forEach((a, i) => {
    const y = 2.72 + i * 0.78;
    s.addShape(ST.ellipse, { x: 1.1, y, w: 0.34, h: 0.34, line: { color: C.tint, transparency: 100 }, fill: { color: C.tint } });
    text(s, a[0], 1.1, y + 0.06, 0.34, 0.2, { fontSize: 9, bold: true, color: C.red, align: 'center' });
    text(s, a[1], 1.62, y - 0.02, 2.05, 0.26, { fontFace: HEAD, fontSize: 12, bold: true });
    text(s, a[2], 3.73, y - 0.03, 4.15, 0.42, { fontSize: 9.5, color: C.gray });
  });
  box(s, 8.8, 2.75, 3.55, 2.55, 'F8F0DF', 'E9D6A9');
  tag(s, 'TEST MODE STATUS', 9.1, 3.05, 1.65, 'E9D6A9', C.amber);
  text(s, 'Not end-to-end tested', 9.1, 3.62, 2.95, 0.62, { fontFace: HEAD, fontSize: 20, bold: true });
  text(s, 'Stripe test credentials are placeholders; native checkout was not run.', 9.1, 4.42, 2.88, 0.58, { fontSize: 11, color: C.ink2, valign: 'top' });
  text(s, 'Web preview does not support paid checkout.', 8.85, 5.72, 3.5, 0.42, { fontSize: 10, color: C.gray, italic: true, align: 'center' });
  note(s, 'Be precise about verification. The native PaymentSheet client and server callables are implemented. Code checks duplicate purchases, event approval, capacity, amount in ZAR, PaymentIntent ownership metadata and succeeded status. The confirmation path uses an idempotent refund if payment succeeded but a ticket could not be fulfilled. However, this project has placeholder Stripe test keys and no Stripe test-mode end-to-end run has been performed. The emulator smoke test confirms checkout fails safely when Stripe is not configured. Never claim a real or test payment succeeded in this demo.');
}

// 11 — Visual system
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'A clearer visual system supports every role', 'The same warm surfaces, red actions and locally bundled type are used across mobile and admin');
  const swatches = [
    ['Brand red', 'E8152A'], ['Text', '202124'], ['Page', 'F7F5F2'],
    ['Surface', 'FFFFFF'], ['Border', 'E5E1DC'], ['Soft red', 'FCE9EC'],
    ['Approved', '217A50'], ['Pending', '865700'], ['Neutral', '5A6572'],
  ];
  swatches.forEach((item, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 0.95 + col * 2.35, y = 2.45 + row * 0.8;
    s.addShape(ST.roundRect, { x, y, w: 0.47, h: 0.47, rectRadius: 0.08, line: { color: item[1] === 'FFFFFF' ? C.border : item[1], width: 0.8 }, fill: { color: item[1] } });
    text(s, item[0], x + 0.62, y + 0.02, 1.45, 0.2, { fontFace: HEAD, fontSize: 10.5, bold: true });
    text(s, `#${item[1]}`, x + 0.62, y + 0.25, 1.4, 0.18, { fontSize: 8.5, color: C.gray });
  });
  box(s, 8.65, 2.4, 3.65, 3.25, C.white);
  text(s, 'Manrope', 8.98, 2.82, 2.9, 0.52, { fontFace: HEAD, fontSize: 25, bold: true });
  text(s, 'Headings and event titles', 8.98, 3.35, 2.9, 0.3, { fontSize: 10, color: C.gray });
  text(s, 'Inter', 8.98, 4.05, 2.9, 0.48, { fontFace: BODY, fontSize: 24, bold: true });
  text(s, 'Body text, labels and controls', 8.98, 4.57, 2.9, 0.3, { fontSize: 10, color: C.gray });
  tag(s, 'LOCAL FONT FILES', 8.98, 5.07, 1.55, C.tint, C.red);
  text(s, 'Feedback states are inline and role-aware.', 1.0, 6.15, 11.2, 0.3, { fontFace: HEAD, fontSize: 16, bold: true, color: C.dark, align: 'center' });
  note(s, 'Explain the red and warm-neutral palette and why it was applied across both products. Manrope is used for headings and prominent titles; Inter handles body copy and controls. Both fonts are bundled locally with the apps so UI typography does not depend on a network font request. Mention the visible loading/error/success feedback added in the UI improvement phases and the consistent status colors.');
}

// 12 — Limits and next work
{
  const s = pptx.addSlide('CONTENT'); heading(s, 'What is complete—and what still needs a real environment', 'Core code and emulator checks are useful progress; release readiness needs service and device validation');
  box(s, 0.85, 2.32, 5.65, 3.95, 'E8EEE9', 'D4E2D7');
  box(s, 6.82, 2.32, 5.65, 3.95, 'F8F0DF', 'E9D6A9');
  tag(s, 'IMPLEMENTED / CHECKED', 1.18, 2.65, 2.15, 'D4E2D7', C.green);
  bullet(s, 'Core roles and event lifecycle', 'Host create/manage, admin moderation and approved event discovery.', 1.18, 3.23, 4.8, C.green);
  bullet(s, 'Emulator smoke checks', 'Auth/profile rules, saved-event ownership, free RSVP, capacity and safe Stripe-unconfigured failure.', 1.18, 4.22, 4.8, C.green);
  bullet(s, 'Build checks', 'Mobile lint/type checks/export and admin production build/lint passed in project phases.', 1.18, 5.28, 4.8, C.green);
  tag(s, 'REMAINING VALIDATION', 7.16, 2.65, 1.98, 'E9D6A9', C.amber);
  bullet(s, 'Prepared demo data', 'Fix/rehearse the local Browse query error and validate host/admin accounts on the chosen test project.', 7.16, 3.23, 4.8, C.amber);
  bullet(s, 'Native and services', 'Build native client; test image selection/upload; deploy reviewed rules only to an agreed test project.', 7.16, 4.22, 4.8, C.amber);
  bullet(s, 'Stripe test walkthrough', 'Add test keys and verify success, cancel, duplicate, capacity and refund paths.', 7.16, 5.28, 4.8, C.amber);
  note(s, 'This slide separates implemented code and emulator checks from validation that has not happened. Current local browser capture showed a Firestore listing error, so a presentation rehearsal should verify the browser query against working test data before promising a live attendee flow. Image upload needs a native development build and test Firebase Storage setup. Stripe secrets in the example file are placeholders; no Stripe test-mode payment walkthrough has been done. Keep test and live project credentials separate.');
}

// 13 — Demo sequence
{
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  s.addShape(ST.rect, { x: 0, y: 0, w: 0.18, h: 7.5, line: { color: C.red, transparency: 100 }, fill: { color: C.red } });
  tag(s, 'LIVE DEMO  /  90 SECONDS', 0.82, 0.7, 2.35, C.red, C.white);
  text(s, 'One event. Three roles.', 0.82, 1.32, 9.8, 0.7, { fontFace: HEAD, fontSize: 34, bold: true, color: C.white });
  const demo = [
    ['01', 'Host', 'Open My Events → create a free event with a future date and venue.'],
    ['02', 'Admin', 'Review the pending event and approve it.'],
    ['03', 'Attendee', 'Find the approved listing, open details and RSVP.'],
  ];
  demo.forEach((d, i) => {
    const y = 2.55 + i * 1.05;
    s.addShape(ST.ellipse, { x: 0.88, y, w: 0.52, h: 0.52, line: { color: '3E4146', width: 1 }, fill: { color: '2D3034' } });
    text(s, d[0], 0.88, y + 0.15, 0.52, 0.2, { fontSize: 10, color: 'F6AAB3', bold: true, align: 'center' });
    text(s, d[1], 1.7, y + 0.01, 1.35, 0.3, { fontFace: HEAD, fontSize: 16, color: C.white, bold: true });
    text(s, d[2], 3.1, y, 6.9, 0.5, { fontSize: 13, color: 'E2DFDA' });
  });
  box(s, 10.4, 2.5, 2.25, 2.5, '2A2C30', '4A4D52');
  text(s, 'Fallback', 10.68, 2.85, 1.7, 0.35, { fontFace: HEAD, fontSize: 17, color: C.white, bold: true });
  text(s, 'If emulator data is unavailable, use the screenshots and explain the verified RSVP smoke test.', 10.68, 3.42, 1.68, 1.08, { fontSize: 10.5, color: 'D6D2CC', valign: 'top' });
  text(s, 'PopUpGp', 0.82, 6.55, 3.0, 0.45, { fontFace: HEAD, fontSize: 25, color: C.white, bold: true });
  text(s, 'Where the city comes alive.', 3.15, 6.6, 4.6, 0.35, { fontFace: HEAD, fontSize: 16, color: 'F6AAB3', bold: true });
  note(s, 'Suggested short demo. Before class, sign into the test emulator and confirm Browse data queries work. First create a free event as the host. Next approve it from the admin console. Finally open the attendee app, find the listing and use the RSVP action. Keep paid checkout out of the web demo; Stripe runs only in a native development build and has not been test-mode verified. If event data or the emulator fails, show the screenshots and clearly state that emulator smoke tests verified free RSVP add/remove/capacity behavior. Close by restating the project’s three roles.');
}

const output = path.join(here, 'PopUpGp_IT_Project_700.pptx');
await pptx.writeFile({ fileName: output });
console.log(`Created ${output} (${pptx._slides.length} slides with speaker notes).`);
