/**
 * Create or promote a Firebase Auth user to Firestore role "admin".
 *
 * Production:
 *   Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path, or use
 *   `gcloud auth application-default login`, then:
 *   npm run promote-admin -- --email you@example.com --password 'your-password'
 *
 * Emulator (Auth + Firestore must already be running):
 *   npm run promote-admin -- --emulator --email you@example.com --password 'your-password'
 */

const admin = require("firebase-admin");

function printUsage() {
  console.log(`Usage:
  npm run promote-admin -- --email <email> [--password <password>] [--display-name <name>] [--emulator]

  --email            Required. Admin account email.
  --password         Required when creating a new Auth user. Optional if the user already exists
                     (unless you want to reset the password).
  --display-name     Optional display name (default: Admin).
  --emulator         Target local Auth (9099) + Firestore (8080) with project demo-popupgp.
  --reset-password   When the Auth user already exists, update their password to --password.

Production needs Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
`);
}

function parseArgs(argv) {
  const options = {
    email: null,
    password: null,
    displayName: "Admin",
    emulator: false,
    resetPassword: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") options.email = argv[++i];
    else if (arg === "--password") options.password = argv[++i];
    else if (arg === "--display-name") options.displayName = argv[++i];
    else if (arg === "--emulator") options.emulator = true;
    else if (arg === "--reset-password") options.resetPassword = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.email || typeof options.email !== "string") {
    console.error("Missing required --email.");
    printUsage();
    process.exit(1);
  }

  const email = options.email.trim().toLowerCase();
  if (!email.includes("@")) {
    console.error("Provide a valid --email.");
    process.exit(1);
  }

  if (options.emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST =
      process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "demo-popupgp";

    admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
    console.log(
      `Using emulators Auth=${process.env.FIREBASE_AUTH_EMULATOR_HOST} Firestore=${process.env.FIRESTORE_EMULATOR_HOST} project=${process.env.GCLOUD_PROJECT}`,
    );
  } else {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "popupgp-b987c";
    admin.initializeApp({ projectId });
    console.log(`Using production project ${projectId}`);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let user;
  let created = false;

  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error && error.code === "auth/user-not-found") {
      if (!options.password) {
        console.error(
          `No Auth user for ${email}. Pass --password to create the account.`,
        );
        process.exit(1);
      }
      if (options.password.length < 6) {
        console.error("Password must be at least 6 characters.");
        process.exit(1);
      }
      user = await auth.createUser({
        email,
        password: options.password,
        displayName: options.displayName,
        emailVerified: true,
      });
      created = true;
    } else {
      throw error;
    }
  }

  if (!created && options.resetPassword) {
    if (!options.password) {
      console.error("--reset-password requires --password.");
      process.exit(1);
    }
    if (options.password.length < 6) {
      console.error("Password must be at least 6 characters.");
      process.exit(1);
    }
    await auth.updateUser(user.uid, { password: options.password });
    console.log(`Updated password for ${email}`);
  }

  if (!created && options.displayName && options.displayName !== "Admin") {
    await auth.updateUser(user.uid, { displayName: options.displayName });
  }

  const userRef = db.collection("users").doc(user.uid);
  const existing = await userRef.get();
  const createdAt = existing.exists
    ? existing.get("createdAt") || admin.firestore.FieldValue.serverTimestamp()
    : admin.firestore.FieldValue.serverTimestamp();

  await userRef.set(
    {
      email,
      displayName:
        options.displayName ||
        user.displayName ||
        (existing.exists ? existing.get("displayName") : null) ||
        "Admin",
      role: "admin",
      createdAt,
    },
    { merge: true },
  );

  console.log("");
  console.log(created ? "Created Auth user and admin profile." : "Promoted existing user to admin.");
  console.log(`  email: ${email}`);
  console.log(`  uid:   ${user.uid}`);
  console.log(`  role:  admin`);
  console.log("");
  console.log("Sign in to admin-web with this email and password.");
  if (options.emulator) {
    console.log("Ensure admin-web .env.local has VITE_USE_FIREBASE_EMULATORS=true.");
  } else {
    console.log("Ensure admin-web .env.local has VITE_USE_FIREBASE_EMULATORS=false (same live project).");
  }
}

main().catch((error) => {
  console.error("");
  console.error("promote-admin failed:");
  console.error(error instanceof Error ? error.message : error);
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("");
    console.error(
      "Tip: for production, set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON, or run `gcloud auth application-default login`.",
    );
  }
  process.exit(1);
});
