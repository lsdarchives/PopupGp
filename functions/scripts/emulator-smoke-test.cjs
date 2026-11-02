const projectId = process.env.GCLOUD_PROJECT || "demo-popupgp";
const authBase = "http://127.0.0.1:9099";
const firestoreBase = "http://127.0.0.1:8080";
const functionsBase = `http://127.0.0.1:5001/${projectId}/us-central1`;
const { initializeApp, deleteApp } = require("../../mobile-app/node_modules/firebase/app");
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require("../../mobile-app/node_modules/firebase/auth");
const {
  connectStorageEmulator,
  deleteObject,
  getBytes,
  getStorage,
  ref,
  uploadBytes,
} = require("../../mobile-app/node_modules/firebase/storage");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { rawResponse: text };
  }
  return { response, body };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createAuthUser(email, password) {
  const { response, body } = await request(
    `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  assert(response.ok, `Auth emulator sign-up failed: ${JSON.stringify(body)}`);
  return { uid: body.localId, token: body.idToken };
}

async function createDocument(collection, id, fields, token) {
  const url = `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${encodeURIComponent(id)}`;
  const { response, body } = await request(url, {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  assert(response.ok, `Could not create ${collection}/${id}: ${JSON.stringify(body)}`);
}

async function updateDocument(collection, id, fields, token) {
  const params = new URLSearchParams();
  for (const field of Object.keys(fields)) params.append("updateMask.fieldPaths", field);
  const url = `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}?${params}`;
  return request(url, {
    method: "PATCH",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
}

async function getDocument(collection, id, token) {
  const url = `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`;
  const { response, body } = await request(url, { headers: authHeader(token) });
  assert(response.ok, `Could not read ${collection}/${id}: ${JSON.stringify(body)}`);
  return body;
}

async function getPath(documentPath, token) {
  return request(
    `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${documentPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { headers: authHeader(token) }
  );
}

async function deletePath(documentPath, token) {
  return request(
    `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${documentPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { method: "DELETE", headers: authHeader(token) }
  );
}

async function callFunction(name, token, data) {
  const { response, body } = await request(`${functionsBase}/${name}`, {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  return { response, body };
}

async function expectDenied(response, body, label) {
  assert(
    response.status === 403 || response.status === 401,
    `${label} should be denied, got HTTP ${response.status}: ${JSON.stringify(body)}`
  );
}

async function testEventImageStorage(hostEmail, userEmail, password, eventId) {
  const bucket = `${projectId}.appspot.com`;
  const hostApp = initializeApp({ apiKey: "fake-api-key", projectId, storageBucket: bucket }, `host-storage-${Date.now()}`);
  const userApp = initializeApp({ apiKey: "fake-api-key", projectId, storageBucket: bucket }, `user-storage-${Date.now()}`);
  const hostAuth = getAuth(hostApp);
  const userAuth = getAuth(userApp);
  connectAuthEmulator(hostAuth, authBase, { disableWarnings: true });
  connectAuthEmulator(userAuth, authBase, { disableWarnings: true });
  const [hostSession, userSession] = await Promise.all([
    signInWithEmailAndPassword(hostAuth, hostEmail, password),
    signInWithEmailAndPassword(userAuth, userEmail, password),
  ]);
  const hostStorage = getStorage(hostApp);
  const userStorage = getStorage(userApp);
  connectStorageEmulator(hostStorage, "127.0.0.1", 9199);
  connectStorageEmulator(userStorage, "127.0.0.1", 9199);
  const imageRef = ref(hostStorage, `events/${eventId}/${hostSession.user.uid}/cover.jpg`);
  const content = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  try {
    await uploadBytes(imageRef, content, { contentType: "image/jpeg" });
    const downloaded = await getBytes(imageRef);
    assert(downloaded.byteLength === content.length, "Host should be able to upload and read an event image.");

    const otherUserImage = ref(userStorage, `events/${eventId}/${hostSession.user.uid}/cover.jpg`);
    let unauthorizedWrite = false;
    try {
      await uploadBytes(otherUserImage, content, { contentType: "image/jpeg" });
    } catch {
      unauthorizedWrite = true;
    }
    assert(unauthorizedWrite, "A different user must not replace the host's event image.");

    let oversizedUploadDenied = false;
    try {
      await uploadBytes(
        ref(hostStorage, `events/${eventId}/${hostSession.user.uid}/cover.png`),
        new Uint8Array(5 * 1024 * 1024 + 1),
        { contentType: "image/png" },
      );
    } catch {
      oversizedUploadDenied = true;
    }
    assert(oversizedUploadDenied, "Storage rules must reject event images larger than 5 MB.");

    let invalidTypeDenied = false;
    try {
      await uploadBytes(
        ref(hostStorage, `events/${eventId}/${hostSession.user.uid}/cover.jpg`),
        content,
        { contentType: "application/octet-stream" },
      );
    } catch {
      invalidTypeDenied = true;
    }
    assert(invalidTypeDenied, "Storage rules must reject non-image content types.");
  } finally {
    await deleteObject(imageRef).catch(() => undefined);
    await Promise.all([deleteApp(hostApp), deleteApp(userApp)]);
  }
}

async function main() {
  const suffix = Date.now();
  const password = "LocalTestOnly123!";
  const hostEmail = `host-${suffix}@example.test`;
  const userEmail = `user-${suffix}@example.test`;
  const host = await createAuthUser(hostEmail, password);
  const user = await createAuthUser(userEmail, password);
  const secondUser = await createAuthUser(`second-user-${suffix}@example.test`, password);
  const admin = await createAuthUser(`admin-${suffix}@example.test`, password);

  const userFields = (uid, email, role) => ({
    email: { stringValue: email },
    displayName: { stringValue: role },
    role: { stringValue: role },
    createdAt: { timestampValue: new Date().toISOString() },
  });

  await createDocument(
    "users",
    host.uid,
    userFields(host.uid, `host-${suffix}@example.test`, "host"),
    host.token
  );
  await createDocument(
    "users",
    user.uid,
    userFields(user.uid, `user-${suffix}@example.test`, "user"),
    user.token
  );
  await createDocument(
    "users",
    secondUser.uid,
    userFields(secondUser.uid, `second-user-${suffix}@example.test`, "user"),
    secondUser.token
  );
  await createDocument(
    "users",
    admin.uid,
    userFields(admin.uid, `admin-${suffix}@example.test`, "admin"),
    "owner"
  );

  const eventId = `smoke-${suffix}`;
  const eventFields = {
    title: { stringValue: "Emulator RSVP smoke test" },
    description: { stringValue: "Local emulator test event" },
    category: { stringValue: "other" },
    hostId: { stringValue: host.uid },
    status: { stringValue: "pending" },
    location: {
      mapValue: {
        fields: {
          lat: { doubleValue: -26.2041 },
          lng: { doubleValue: 28.0473 },
          address: { stringValue: "Johannesburg" },
        },
      },
    },
    geohash: { stringValue: "kek2" },
    startAt: { timestampValue: new Date(Date.now() + 86400000).toISOString() },
    endAt: { timestampValue: new Date(Date.now() + 97200000).toISOString() },
    rsvpCount: { integerValue: "0" },
    capacity: { integerValue: "1" },
    ticketPrice: { doubleValue: 0 },
  };
  await createDocument("events", eventId, eventFields, host.token);
  await testEventImageStorage(hostEmail, userEmail, password, eventId);

  const hostApprovalAttempt = await updateDocument(
    "events",
    eventId,
    { status: { stringValue: "approved" } },
    host.token
  );
  await expectDenied(
    hostApprovalAttempt.response,
    hostApprovalAttempt.body,
    "Host self-approval"
  );

  const adminApproval = await updateDocument(
    "events",
    eventId,
    { status: { stringValue: "approved" } },
    admin.token
  );
  assert(
    adminApproval.response.ok,
    `Admin approval failed: ${JSON.stringify(adminApproval.body)}`
  );

  const profileUpdate = await updateDocument(
    "users",
    user.uid,
    { displayName: { stringValue: "Updated Guest Name" } },
    user.token
  );
  assert(profileUpdate.response.ok, `User could not update their name: ${JSON.stringify(profileUpdate.body)}`);
  const updatedProfile = await getDocument("users", user.uid, user.token);
  assert(
    updatedProfile.fields.displayName.stringValue === "Updated Guest Name",
    "The profile name change should be persisted."
  );
  const profileRoleChange = await updateDocument(
    "users",
    user.uid,
    { role: { stringValue: "host" } },
    user.token
  );
  await expectDenied(profileRoleChange.response, profileRoleChange.body, "Self-service role change");

  const savedEventCreate = await createDocumentAttempt(
    `users/${user.uid}/savedEvents`,
    eventId,
    {
      eventId: { stringValue: eventId },
      createdAt: { timestampValue: new Date().toISOString() },
    },
    user.token
  );
  assert(savedEventCreate.response.ok, `User could not save an upcoming event: ${JSON.stringify(savedEventCreate.body)}`);
  const ownSavedEventRead = await getPath(`users/${user.uid}/savedEvents/${eventId}`, user.token);
  assert(ownSavedEventRead.response.ok, `User could not read their saved event: ${JSON.stringify(ownSavedEventRead.body)}`);
  const otherUserSavedEventRead = await getPath(`users/${user.uid}/savedEvents/${eventId}`, secondUser.token);
  await expectDenied(otherUserSavedEventRead.response, otherUserSavedEventRead.body, "Other user reading a saved event");
  const savedEventDelete = await deletePath(`users/${user.uid}/savedEvents/${eventId}`, user.token);
  assert(savedEventDelete.response.ok, `User could not remove their saved event: ${JSON.stringify(savedEventDelete.body)}`);

  const directRsvpAttempt = await createDocumentAttempt(
    "rsvps",
    `direct-${suffix}`,
    {
      eventId: { stringValue: eventId },
      userId: { stringValue: user.uid },
      status: { stringValue: "going" },
    },
    user.token
  );
  await expectDenied(directRsvpAttempt.response, directRsvpAttempt.body, "Direct RSVP write");

  const going = await callFunction("toggleFreeRsvp", user.token, { eventId });
  assert(going.response.ok, `Free RSVP failed: ${JSON.stringify(going.body)}`);
  assert(going.body.result?.isGoing === true, "First RSVP call should add the RSVP.");
  let event = await getDocument("events", eventId, user.token);
  assert(event.fields.rsvpCount.integerValue === "1", "RSVP count should increment to 1.");

  const cancelled = await callFunction("toggleFreeRsvp", user.token, { eventId });
  assert(cancelled.response.ok, `RSVP cancellation failed: ${JSON.stringify(cancelled.body)}`);
  assert(cancelled.body.result?.isGoing === false, "Second RSVP call should remove the RSVP.");
  event = await getDocument("events", eventId, user.token);
  assert(event.fields.rsvpCount.integerValue === "0", "RSVP count should return to 0.");

  const goingAgain = await callFunction("toggleFreeRsvp", user.token, { eventId });
  assert(goingAgain.response.ok, `Could not fill the event: ${JSON.stringify(goingAgain.body)}`);
  assert(goingAgain.body.result?.isGoing === true, "RSVP should be added again to fill capacity.");
  const fullAttempt = await callFunction("toggleFreeRsvp", secondUser.token, { eventId });
  assert(!fullAttempt.response.ok, "RSVP should fail when the event is at capacity.");
  event = await getDocument("events", eventId, user.token);
  assert(event.fields.rsvpCount.integerValue === "1", "Failed RSVP must not change the count.");

  const paidRsvpId = `paid-${suffix}`;
  await createDocument(
    "rsvps",
    paidRsvpId,
    {
      eventId: { stringValue: eventId },
      userId: { stringValue: user.uid },
      status: { stringValue: "going" },
      ticketPurchased: { booleanValue: true },
      paymentStatus: { stringValue: "paid" },
      paymentIntentId: { stringValue: `pi_smoke_${suffix}` },
    },
    admin.token
  );
  const paidRsvpCancelAttempt = await callFunction("toggleFreeRsvp", user.token, { eventId });
  assert(!paidRsvpCancelAttempt.response.ok, "Free RSVP toggle must not remove a paid ticket.");
  event = await getDocument("events", eventId, user.token);
  assert(event.fields.rsvpCount.integerValue === "1", "Paid ticket attempts must not change capacity.");
  const paidRsvp = await getDocument("rsvps", paidRsvpId, user.token);
  assert(paidRsvp.fields.ticketPurchased.booleanValue, "Paid ticket record must remain intact.");

  const paidEventId = `paid-event-${suffix}`;
  await createDocument(
    "events",
    paidEventId,
    {
      ...eventFields,
      title: { stringValue: "Paid checkout configuration smoke test" },
      status: { stringValue: "pending" },
      rsvpCount: { integerValue: "0" },
      capacity: { integerValue: "5" },
      ticketPrice: { doubleValue: 25 },
    },
    host.token
  );
  const paidEventApproval = await updateDocument(
    "events",
    paidEventId,
    { status: { stringValue: "approved" } },
    admin.token
  );
  assert(paidEventApproval.response.ok, "Admin should approve the paid checkout smoke event.");
  const unconfiguredPayment = await callFunction("createTicketPayment", secondUser.token, {
    eventId: paidEventId,
    requestId: `smoke-${suffix}`,
  });
  assert(!unconfiguredPayment.response.ok, "Paid checkout must fail without Stripe configuration.");
  assert(
    unconfiguredPayment.body.error?.status === "FAILED_PRECONDITION",
    `Missing Stripe configuration should be reported clearly: ${JSON.stringify(unconfiguredPayment.body)}`
  );

  console.log("PASS: signup/profile rules, profile name update and role protection, owner-only saved events,");
  console.log("      host event creation, approval, direct RSVP denial, free RSVP add/remove, capacity,");
  console.log("      paid-ticket protection,");
  console.log("      and safe failure when Stripe is not configured.");
}

async function createDocumentAttempt(collection, id, fields, token) {
  const url = `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${encodeURIComponent(id)}`;
  return request(url, {
    method: "POST",
    headers: {
      ...authHeader(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
