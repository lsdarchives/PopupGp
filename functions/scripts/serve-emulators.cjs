const { spawn } = require("node:child_process");
const { existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "../..");
const exportDirectory = path.join(projectRoot, ".firebase-emulator-data");
const exportMetadata = path.join(exportDirectory, "firebase-export-metadata.json");

mkdirSync(exportDirectory, { recursive: true });

const args = [
  "emulators:start",
  "--project",
  "demo-popupgp",
  "--only",
  "auth,firestore,functions,storage",
  `--export-on-exit=${exportDirectory}`,
];

if (existsSync(exportMetadata)) {
  args.push(`--import=${exportDirectory}`);
} else {
  console.log("No saved emulator data found; starting with an empty local database.");
}

const command = process.platform === "win32" ? "firebase.cmd" : "firebase";
const emulator = spawn(command, args, {
  cwd: projectRoot,
  shell: process.platform === "win32",
  stdio: "inherit",
});

emulator.on("error", (error) => {
  console.error("Could not start Firebase emulators.", error);
  process.exitCode = 1;
});

emulator.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 1;
});
