const { execSync } = require("child_process");

const ALLOWED_BRANCHES = ["main", "backup-work-in-progress"];
const currentBranch = execSync("git branch --show-current").toString().trim();

if (!ALLOWED_BRANCHES.includes(currentBranch)) {
  console.error(`ERROR: Cannot run dev server from branch "${currentBranch}"`);
  console.error(`Allowed branches: ${ALLOWED_BRANCHES.join(", ")}`);
  process.exit(1);
}

console.log(`Branch OK: ${currentBranch}`);
