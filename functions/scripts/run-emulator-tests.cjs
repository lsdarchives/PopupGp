const { spawnSync } = require("node:child_process");
const path = require("node:path");

const functionsDir = path.resolve(__dirname, "..");
function getFirestoreEmulatorPids() {
  if (process.platform !== "win32") return new Set();

  const command =
    "$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*cloud-firestore-emulator*' -and $_.CommandLine -like '*--project_id demo-popupgp*' }; ConvertTo-Json -InputObject @($processes | ForEach-Object { $_.ProcessId }) -Compress";
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not inspect Firestore emulator processes.");
  }

  const output = result.stdout.trim();
  if (!output) return new Set();

  const processIds = JSON.parse(output);
  return new Set((Array.isArray(processIds) ? processIds : [processIds]).map(Number));
}

function stopNewFirestoreEmulators(existingPids) {
  const newPids = [...getFirestoreEmulatorPids()].filter((pid) => !existingPids.has(pid));
  for (const pid of newPids) {
    const command = `$processId = ${pid}; if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) { exit 0 }; Stop-Process -Id $processId -ErrorAction SilentlyContinue; for ($attempt = 0; $attempt -lt 20; $attempt++) { if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) { exit 0 }; Start-Sleep -Milliseconds 250 }; exit 1`;
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-Command", command],
      { encoding: "utf8" }
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || `Could not stop Firestore emulator process ${pid}.`);
    }
  }
}

const existingFirestorePids = getFirestoreEmulatorPids();
let result;
try {
  result = spawnSync(
    'firebase --config "../firebase.json" emulators:exec --project demo-popupgp --only auth,firestore,functions,storage "node scripts/emulator-smoke-test.cjs"',
    {
      cwd: functionsDir,
      env: {
        ...process.env,
        FUNCTIONS_DISCOVERY_TIMEOUT: "60",
      },
      shell: true,
      stdio: "inherit",
    }
  );
} finally {
  stopNewFirestoreEmulators(existingFirestorePids);
}

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
