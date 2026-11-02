import pptxgen from 'pptxgenjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'PopUpGp Project Team';
pptx.company = 'PopUpGp';
pptx.subject = 'Five-minute IT Project 700 presentation';
pptx.title = 'PopUpGp — Five-minute project presentation';
pptx.lang = 'en-ZA';
pptx.theme = { headFontFace: 'Manrope', bodyFontFace: 'Inter', lang: 'en-ZA' };

const S = pptx.ShapeType;
const C = {
  red: 'E8152A', dark: '202124', bg: 'F7F5F2', white: 'FFFFFF', gray: '64666B',
  border: 'E5E1DC', tint: 'FCE9EC', green: '217A50', amber: '865700', paleGreen: 'E8EEE9', paleAmber: 'F8F0DF',
};
const HEAD = 'Manrope';
const BODY = 'Inter';

pptx.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.bg },
  objects: [
    { rect: { x: 0.55, y: 0.38, w: 0.09, h: 0.34, line: { color: C.red, transparency: 100 }, fill: { color: C.red } } },
    { text: { text: 'POPUPGP  /  IT PROJECT 700', options: { x: 0.77, y: 0.42, w: 5.8, h: 0.2, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, charSpacing: 1.1, color: C.gray } } },
    { line: { x: 0.55, y: 7.05, w: 12.2, h: 0, line: { color: C.border, width: 0.7 } } },
    { text: { text: 'Where the city comes alive', options: { x: 0.55, y: 7.12, w: 3.7, h: 0.16, margin: 0, fontFace: BODY, fontSize: 7.5, color: C.gray } } },
  ],
  slideNumber: { x: 12.27, y: 7.1, w: 0.35, h: 0.18, color: C.gray, fontFace: BODY, fontSize: 8 },
});

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(value, {
    x, y, w, h, margin: 0, fontFace: options.fontFace ?? BODY, fontSize: options.fontSize ?? 13,
    color: options.color ?? C.dark, bold: options.bold ?? false, align: options.align ?? 'left',
    valign: options.valign ?? 'mid', fit: 'shrink', italic: options.italic ?? false,
    charSpacing: options.charSpacing, breakLine: false,
  });
}

function card(slide, x, y, w, h, fill = C.white, line = C.border) {
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: line, width: 0.8 } });
}

function label(slide, value, x, y, w, fill = C.tint, color = C.red) {
  slide.addShape(S.roundRect, { x, y, w, h: 0.3, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  addText(slide, value, x + 0.1, y + 0.035, w - 0.2, 0.2, { fontSize: 8.5, color, bold: true, align: 'center' });
}

function heading(slide, title, subtitle) {
  addText(slide, title, 0.65, 0.95, 11.85, 0.53, { fontFace: HEAD, fontSize: 27, bold: true });
  addText(slide, subtitle, 0.68, 1.59, 11.55, 0.32, { fontSize: 11.5, color: C.gray });
}

function point(slide, title, copy, x, y, w, accent = C.red) {
  slide.addShape(S.ellipse, { x, y: y + 0.08, w: 0.13, h: 0.13, fill: { color: accent }, line: { color: accent, transparency: 100 } });
  addText(slide, title, x + 0.25, y, w - 0.25, 0.26, { fontFace: HEAD, fontSize: 13, bold: true });
  addText(slide, copy, x + 0.25, y + 0.3, w - 0.25, 0.45, { fontSize: 9.8, color: C.gray, valign: 'top' });
}

function image(slide, name, x, y, w, h) {
  slide.addShape(S.roundRect, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.12, fill: { color: C.white }, line: { color: C.border, width: 0.8 } });
  slide.addImage({ path: path.join(here, 'screenshots', name), x, y, w, h });
}

function notes(slide, value) { slide.addNotes(value); }

// 1 — title
{
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  slide.addShape(S.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.red }, line: { color: C.red, transparency: 100 } });
  label(slide, 'IT PROJECT 700  •  5 MINUTES', 0.76, 0.68, 2.42, C.red, C.white);
  addText(slide, 'PopUpGp', 0.76, 1.43, 6.0, 0.8, { fontFace: HEAD, fontSize: 44, bold: true, color: C.white });
  addText(slide, 'Where the city comes alive', 0.8, 2.36, 5.6, 0.38, { fontFace: HEAD, fontSize: 19, color: 'F5DDE0', bold: true });
  addText(slide, 'A platform for discovering, hosting and moderating pop-up events in Gauteng.', 0.8, 3.2, 5.7, 0.68, { fontSize: 17, color: 'E4E0DB', valign: 'top' });
  addText(slide, 'Problem  •  Requirements  •  Solution  •  Proof  •  Live demo', 0.8, 6.55, 6.4, 0.24, { fontSize: 10, color: 'CFCAC4', bold: true, charSpacing: 0.5 });
  slide.addShape(S.roundRect, { x: 8.35, y: 0.62, w: 3.35, h: 6.15, rectRadius: 0.25, fill: { color: '17181A' }, line: { color: '575A5F', width: 1 } });
  slide.addImage({ path: path.join(here, 'screenshots', '01-role-selection.png'), x: 8.5, y: 0.8, w: 3.05, h: 5.75 });
  notes(slide, 'Timing: 15 seconds. Introduce PopUpGp as a complete role-based event platform. State the goal clearly: make it easier for people in Gauteng to find local pop-up events, while giving hosts a structured publishing flow and admins a moderation point. Say that this is a short overview followed by a live demo.');
}

// 2 — problem and goals
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Problem statement and project goal', 'The project addresses a practical gap in the event journey.');
  card(slide, 0.8, 2.25, 3.72, 3.35);
  card(slide, 4.82, 2.25, 3.72, 3.35);
  card(slide, 8.84, 2.25, 3.72, 3.35);
  label(slide, 'ATTENDEE PROBLEM', 1.1, 2.6, 1.65);
  addText(slide, 'Local events are hard to discover in one trusted place.', 1.1, 3.1, 3.05, 0.82, { fontFace: HEAD, fontSize: 18, bold: true, valign: 'top' });
  addText(slide, 'People need clear details, a simple RSVP and a way to revisit events.', 1.1, 4.2, 3.03, 0.6, { fontSize: 11, color: C.gray, valign: 'top' });
  label(slide, 'HOST PROBLEM', 5.12, 2.6, 1.25);
  addText(slide, 'Event creation needs structure and visibility.', 5.12, 3.1, 3.05, 0.82, { fontFace: HEAD, fontSize: 18, bold: true, valign: 'top' });
  addText(slide, 'Hosts need dates, location, capacity, price, image and event status in one flow.', 5.12, 4.2, 3.03, 0.62, { fontSize: 11, color: C.gray, valign: 'top' });
  label(slide, 'PLATFORM PROBLEM', 9.14, 2.6, 1.55);
  addText(slide, 'Listings need review before they become public.', 9.14, 3.1, 3.05, 0.82, { fontFace: HEAD, fontSize: 18, bold: true, valign: 'top' });
  addText(slide, 'An admin must approve, reject or cancel events to maintain quality.', 9.14, 4.2, 3.03, 0.62, { fontSize: 11, color: C.gray, valign: 'top' });
  addText(slide, 'Goal: one connected workflow from event submission to approved discovery and RSVP.', 0.95, 6.15, 11.4, 0.32, { fontFace: HEAD, fontSize: 16, bold: true, color: C.red, align: 'center' });
  notes(slide, 'Timing: 35 seconds. Explain the three problem statements. Avoid presenting them as quantified research findings; present them as the product problem the system is designed to solve. The objective is a connected event lifecycle: a host submits, an admin moderates, and an attendee discovers and RSVPs.');
}

// 3 — solution and scope
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Solution: one platform, three focused roles', 'Each role gets a simple interface while sharing the same event lifecycle.');
  const data = [
    ['01', 'Attendee', 'Discover approved events', 'Browse, search, save events and RSVP to a free event.'],
    ['02', 'Host', 'Create and manage events', 'Provide venue, date, capacity, price and an optional image.'],
    ['03', 'Admin', 'Moderate the platform', 'Review pending events and control their published status.'],
  ];
  data.forEach((item, index) => {
    const x = 0.82 + index * 4.08;
    card(slide, x, 2.3, 3.62, 3.45);
    slide.addShape(S.ellipse, { x: x + 0.26, y: 2.63, w: 0.5, h: 0.5, fill: { color: C.tint }, line: { color: C.tint, transparency: 100 } });
    addText(slide, item[0], x + 0.26, 2.77, 0.5, 0.18, { fontSize: 9, color: C.red, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.27, 3.4, 3.0, 0.34, { fontFace: HEAD, fontSize: 21, bold: true });
    label(slide, item[2], x + 0.27, 3.85, 2.2, index === 2 ? C.paleGreen : C.tint, index === 2 ? C.green : C.red);
    addText(slide, item[3], x + 0.27, 4.4, 2.95, 0.65, { fontSize: 11, color: C.gray, valign: 'top' });
  });
  addText(slide, 'Host submits  →  Admin approves  →  Attendee discovers and RSVPs', 1.05, 6.2, 11.0, 0.3, { fontFace: HEAD, fontSize: 16, bold: true, align: 'center' });
  notes(slide, 'Timing: 35 seconds. Move left to right. The attendee sees approved events only. The host creates and manages their own events. The admin is the quality gate. This demonstrates that the project is more than a user interface: it has an end-to-end role-based workflow.');
}

// 4 — functional requirements and lifecycle
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Core requirements and event lifecycle', 'The implementation turns the problem into an observable end-to-end workflow.');
  const stages = [
    ['1', 'Create', 'Host adds title, details, category, venue, coordinates, schedule, capacity and price.'],
    ['2', 'Moderate', 'The event starts as pending. An admin can approve, reject or cancel it.'],
    ['3', 'Discover', 'Approved events appear to attendees in Browse and the native map experience.'],
    ['4', 'Engage', 'Attendees can save upcoming events and RSVP to free events, subject to capacity.'],
  ];
  stages.forEach((item, index) => {
    const x = 0.74 + index * 3.1;
    card(slide, x, 2.55, 2.72, 2.75, index === 1 ? C.tint : C.white);
    slide.addShape(S.ellipse, { x: x + 0.22, y: 2.85, w: 0.42, h: 0.42, fill: { color: C.red }, line: { color: C.red, transparency: 100 } });
    addText(slide, item[0], x + 0.22, 2.98, 0.42, 0.16, { fontSize: 9, color: C.white, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.22, 3.55, 2.1, 0.3, { fontFace: HEAD, fontSize: 17, bold: true });
    addText(slide, item[2], x + 0.22, 4.02, 2.15, 0.78, { fontSize: 9.7, color: C.gray, valign: 'top' });
    if (index < 3) addText(slide, '→', x + 2.72, 3.67, 0.34, 0.26, { fontFace: HEAD, fontSize: 20, color: C.red, bold: true, align: 'center' });
  });
  card(slide, 1.2, 5.8, 10.9, 0.55, 'F1EDE8', 'F1EDE8');
  addText(slide, 'Control point: only approved events are public; RSVP is handled through a server function, not a direct client write.', 1.45, 5.96, 10.4, 0.2, { fontFace: HEAD, fontSize: 12, bold: true, color: C.dark, align: 'center' });
  notes(slide, 'Timing: 30 seconds. This is the central project workflow. Hosts do not publish directly to the public list: they create an event and it becomes pending. The administrator reviews it. Only an approved event becomes visible to attendees. Finally, attendees can save the event and use free RSVP. Mention the technical control point: the client cannot directly write RSVP records; Cloud Functions validate the request and capacity.');
}

// 5 — implementation evidence
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Implementation evidence: real mobile screens', 'The interface was refined for clear actions, feedback and role-based navigation.');
  image(slide, '01-role-selection.png', 0.9, 2.15, 2.52, 4.55);
  image(slide, '05-host-create-event.png', 4.18, 2.15, 2.52, 4.55);
  card(slide, 7.48, 2.22, 4.63, 4.3);
  point(slide, 'Role selection and authentication', 'Users choose the attendee or host journey before signing in.', 7.84, 2.72, 3.8);
  point(slide, 'Better host event creation', 'The form captures the fields needed for a meaningful listing, including guided location support.', 7.84, 3.8, 3.8);
  point(slide, 'Profile and saved events', 'Users can edit their display name and return to saved upcoming approved events.', 7.84, 4.98, 3.8);
  label(slide, 'LOCAL WEB PREVIEW CAPTURES', 7.84, 6.08, 2.15, 'F1EDE8', C.gray);
  notes(slide, 'Timing: 35 seconds. These are actual screenshots taken from the project’s local web preview. Point to the role selector and the event creation form. Mention that the host form includes category, venue, coordinates, date/time, capacity and price. The system also implements profile editing, saved events, and optional event images. Do not focus on browser-only limitations here; those are covered on the verification slide.');
}

// 6 — architecture/security
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Architecture and security', 'Two clients share Firebase services; critical RSVP and payment decisions happen server-side.');
  const nodes = [
    [0.85, 2.45, 'Expo 56 mobile app', 'Attendee + host journeys', C.white],
    [0.85, 4.43, 'React + Vite admin', 'Moderation and analytics', C.white],
    [4.93, 2.45, 'Firebase Auth', 'Identity + role profile', C.tint],
    [4.93, 4.43, 'Cloud Firestore', 'Users, events, saves, RSVPs', C.tint],
    [9.0, 2.45, 'Cloud Functions', 'Free RSVP + payment confirmation', C.white],
    [9.0, 4.43, 'Storage + Stripe', 'Event image + native checkout', C.white],
  ];
  nodes.forEach(([x, y, title, detail, fill]) => {
    card(slide, x, y, 3.05, 0.95, fill);
    addText(slide, title, x + 0.17, y + 0.18, 2.7, 0.24, { fontFace: HEAD, fontSize: 14, bold: true });
    addText(slide, detail, x + 0.17, y + 0.52, 2.7, 0.18, { fontSize: 8.8, color: C.gray });
  });
  addText(slide, '→', 4.07, 2.77, 0.55, 0.3, { fontFace: HEAD, fontSize: 22, color: C.red, bold: true, align: 'center' });
  addText(slide, '→', 4.07, 4.75, 0.55, 0.3, { fontFace: HEAD, fontSize: 22, color: C.red, bold: true, align: 'center' });
  addText(slide, '→', 8.1, 3.73, 0.55, 0.3, { fontFace: HEAD, fontSize: 22, color: C.red, bold: true, align: 'center' });
  label(slide, 'SECURITY: ROLES + RULES + SERVER VALIDATION', 3.55, 6.15, 3.55, C.dark, C.white);
  notes(slide, 'Timing: 40 seconds. Explain that the app is made of an Expo mobile app for users and hosts, and a React/Vite web app for admins. Firebase Authentication identifies users; Firestore stores data; Cloud Functions own sensitive RSVP and ticket confirmation changes. Firestore rules restrict profile, event and saved-event access by ownership and role. Image upload rules constrain host, file type and size. Stripe secrets stay on the server.');
}

// 7 — testing and limitations
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Testing results and honest project status', 'The assessment evidence separates verified behaviour from work that still needs a live service or device.');
  card(slide, 0.82, 2.28, 5.55, 3.95, C.paleGreen, 'D4E2D7');
  card(slide, 6.83, 2.28, 5.55, 3.95, C.paleAmber, 'E9D6A9');
  label(slide, 'VERIFIED LOCALLY', 1.16, 2.62, 1.65, 'D4E2D7', C.green);
  point(slide, 'Build and quality checks', 'Functions build; mobile lint, TypeScript and web export; admin build and lint passed.', 1.16, 3.15, 4.7, C.green);
  point(slide, 'Emulator smoke test', 'Covers profile ownership, saved events, host creation, moderation, free RSVP and capacity.', 1.16, 4.32, 4.7, C.green);
  point(slide, 'Protected behaviour', 'Direct RSVP writes are denied; a paid ticket cannot be removed using the free RSVP action.', 1.16, 5.43, 4.7, C.green);
  label(slide, 'NEXT VALIDATION', 7.18, 2.62, 1.4, 'E9D6A9', C.amber);
  point(slide, 'Native image flow', 'Needs a development build and a Firebase test project with Storage rules deployed.', 7.18, 3.15, 4.7, C.amber);
  point(slide, 'Stripe test mode', 'Native-only checkout is implemented but needs test keys and an end-to-end payment walkthrough.', 7.18, 4.32, 4.7, C.amber);
  point(slide, 'Presentation demo', 'Use a free event in the web preview; do not demonstrate paid checkout in the browser.', 7.18, 5.43, 4.7, C.amber);
  addText(slide, 'Repository evidence: README implementation status • Firestore rules • Functions emulator smoke test', 1.1, 6.48, 10.2, 0.18, { fontSize: 8.2, color: C.gray, italic: true, align: 'center' });
  notes(slide, 'Timing: 40 seconds. This slide builds credibility. State what has been checked: automated Functions emulator smoke test, app and admin build/lint checks. The emulator verifies that profile and saved-event access is owner-only, free RSVP changes counts safely, capacity is enforced, and direct RSVP writes are rejected. Then be honest: image upload needs native device testing and Storage setup; Stripe needs test credentials and native end-to-end testing. The browser demo will use free RSVP only.');
}

// 8 — live demo
{
  const slide = pptx.addSlide('CONTENT');
  heading(slide, 'Live demo: three terminals, one workflow', 'Run these commands first. Then demonstrate the shortest complete free-event journey.');
  const terminals = [
    ['1', 'Firebase emulators', 'cd functions\nnpm run serve', 'Keeps Auth, Firestore, Functions and Storage local.'],
    ['2', 'Mobile web app', 'cd mobile-app\nnpx expo start --web --port 8083', 'Open http://localhost:8083 for attendee and host.'],
    ['3', 'Admin web app', 'cd admin-web\nnpm run dev -- --port 5174', 'Open http://localhost:5174 for moderation.'],
  ];
  terminals.forEach((item, index) => {
    const x = 0.8 + index * 4.05;
    card(slide, x, 2.25, 3.55, 2.1);
    slide.addShape(S.ellipse, { x: x + 0.25, y: 2.55, w: 0.43, h: 0.43, fill: { color: C.red }, line: { color: C.red, transparency: 100 } });
    addText(slide, item[0], x + 0.25, 2.68, 0.43, 0.16, { fontSize: 9, color: C.white, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.86, 2.5, 2.4, 0.24, { fontFace: HEAD, fontSize: 14, bold: true });
    card(slide, x + 0.24, 3.08, 3.07, 0.67, C.dark, C.dark);
    addText(slide, item[2], x + 0.4, 3.18, 2.72, 0.46, { fontFace: 'Courier New', fontSize: 9, color: C.white, valign: 'top' });
    addText(slide, item[3], x + 0.25, 4.53, 3.05, 0.4, { fontSize: 9.2, color: C.gray, valign: 'top' });
  });
  card(slide, 0.9, 5.45, 11.55, 0.93, C.white);
  addText(slide, 'Demo order:', 1.2, 5.75, 1.18, 0.2, { fontFace: HEAD, fontSize: 12, bold: true, color: C.red });
  addText(slide, 'Host creates a free future event  →  Admin approves it  →  Attendee finds it and RSVPs.', 2.42, 5.75, 9.3, 0.22, { fontFace: HEAD, fontSize: 13, bold: true });
  notes(slide, 'Timing: 60–90 seconds. Start the three terminals before presenting and keep them running. Terminal 1 starts the Firebase emulators once. Terminal 2 runs the mobile web app at localhost:8083. Terminal 3 runs the admin web app at localhost:5174. For the demo: sign in as host, create a FREE event in the future with valid Gauteng coordinates; sign in as admin and approve it; sign in as attendee, refresh Browse, open the event and RSVP. Keep ticket price at zero because browser preview does not support Stripe checkout. If the emulator data query fails, use the screenshots and explain that the verified emulator smoke test covers free RSVP and capacity.');
}

// 9 — conclusion
{
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  slide.addShape(S.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.red }, line: { color: C.red, transparency: 100 } });
  label(slide, 'CONCLUSION', 0.78, 0.72, 1.3, C.red, C.white);
  addText(slide, 'PopUpGp delivers a complete event lifecycle.', 0.78, 1.42, 10.8, 0.65, { fontFace: HEAD, fontSize: 32, bold: true, color: C.white });
  const claims = [
    ['Role-based', 'Attendee discovery, host operations and admin moderation.'],
    ['Built with safeguards', 'Firebase rules and server-side Functions protect key actions.'],
    ['Evidence-led', 'Build checks and emulator smoke tests support the core free-event flow.'],
  ];
  claims.forEach((item, index) => {
    const y = 2.55 + index * 0.94;
    slide.addShape(S.ellipse, { x: 0.86, y: y + 0.06, w: 0.18, h: 0.18, fill: { color: 'F6AAB3' }, line: { color: 'F6AAB3', transparency: 100 } });
    addText(slide, item[0], 1.35, y, 2.25, 0.27, { fontFace: HEAD, fontSize: 16, bold: true, color: C.white });
    addText(slide, item[1], 3.72, y, 6.9, 0.32, { fontSize: 13, color: 'DEDAD5' });
  });
  addText(slide, 'Next validation: native images and Stripe test-mode checkout.', 0.8, 5.86, 7.8, 0.32, { fontSize: 13, color: 'F6AAB3', bold: true });
  addText(slide, 'Thank you  •  Questions?', 0.8, 6.65, 5.5, 0.36, { fontFace: HEAD, fontSize: 22, bold: true, color: C.white });
  notes(slide, 'Timing: 15 seconds. Close with the strongest claim you can support: PopUpGp implements the central event lifecycle across attendee, host and admin roles. It uses role-aware rules and server-side functions for core actions, and has local build and emulator evidence. State the next validation items briefly if asked: native image upload and Stripe test-mode checkout. Invite questions.');
}

const destination = path.join(here, 'PopUpGp_IT_Project_700_5_Minute_Updated.pptx');
await pptx.writeFile({ fileName: destination });
console.log(`Created ${destination} (${pptx._slides.length} slides with speaker notes).`);
