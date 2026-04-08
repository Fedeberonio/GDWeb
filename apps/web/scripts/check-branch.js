const { execSync } = require("child_process");
const path = require("path");

try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
} catch {
  // Do not block dev if dotenv isn't available for some reason.
}

const ALLOWED_BRANCHES = ["main", "backup-work-in-progress"];
const currentBranch = execSync("git branch --show-current").toString().trim();

if (!ALLOWED_BRANCHES.includes(currentBranch)) {
  console.error(`ERROR: Cannot run dev server from branch "${currentBranch}"`);
  console.error(`Allowed branches: ${ALLOWED_BRANCHES.join(", ")}`);
  process.exit(1);
}

const allowProd = String(process.env.ALLOW_PROD_FIREBASE || "").trim() === "1";
const firebaseProjectId = String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
if (!allowProd && firebaseProjectId === "greendolio-tienda") {
  console.error(`ERROR: Refusing to start dev with Firebase project "${firebaseProjectId}" (legacy production).`);
  console.error("Fix: update apps/web/.env.local to greendolio-staging, or set ALLOW_PROD_FIREBASE=1 to override.");
  process.exit(1);
}

console.log(`Branch OK: ${currentBranch}`);
