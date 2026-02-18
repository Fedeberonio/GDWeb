#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process from "process";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PRODUCTS_COLLECTION = "catalog_products";
const DEFAULT_TARGET_CATEGORY = "otros";
const TARGET_SKU = "GD-CASE-007";
const LEGUMBRES_CATEGORY = "legumbres";

function parseArgs(argv) {
  const args = {
    apply: false,
    yes: false,
    rollbackFile: null,
    projectId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--rollback") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --rollback");
      args.rollbackFile = next;
      index += 1;
    } else if (arg === "--project") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --project");
      args.projectId = next;
      index += 1;
    }
  }

  return args;
}

function resolveServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inlineJson) return JSON.parse(inlineJson);

  const candidates = [
    path.resolve("service-account.json"),
    path.resolve("apps/web/service-account.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }

  throw new Error("No service account found. Expected service-account.json in repo root.");
}

function resolveExpectedProjectId(argProjectId) {
  return (
    argProjectId ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    null
  );
}

function initAdminApp(serviceAccount, expectedProjectId) {
  const serviceProjectId = serviceAccount.project_id || null;
  if (expectedProjectId && serviceProjectId && expectedProjectId !== serviceProjectId) {
    throw new Error(
      `Project mismatch: expected "${expectedProjectId}", service account points to "${serviceProjectId}"`,
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  return {
    projectId: serviceProjectId || expectedProjectId || "unknown",
    db: getFirestore(),
  };
}

function createBackupDir() {
  const dir = path.resolve("data/backups/phase1-category-migration");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function fetchTargetDocs(db) {
  const bySkuQuery = db
    .collection(PRODUCTS_COLLECTION)
    .where("sku", "==", TARGET_SKU)
    .get();
  const byLegumbresQuery = db
    .collection(PRODUCTS_COLLECTION)
    .where("categoryId", "==", LEGUMBRES_CATEGORY)
    .get();
  const directDocQuery = db.collection(PRODUCTS_COLLECTION).doc(TARGET_SKU).get();

  const [bySkuSnap, byLegumbresSnap, directDocSnap] = await Promise.all([
    bySkuQuery,
    byLegumbresQuery,
    directDocQuery,
  ]);

  const byId = new Map();

  for (const doc of bySkuSnap.docs) {
    byId.set(doc.id, {
      id: doc.id,
      reason: "sku-match",
      data: doc.data(),
      ref: doc.ref,
    });
  }

  if (directDocSnap.exists) {
    byId.set(directDocSnap.id, {
      id: directDocSnap.id,
      reason: "doc-id-match",
      data: directDocSnap.data(),
      ref: directDocSnap.ref,
    });
  }

  const legumbresDocs = [];
  for (const doc of byLegumbresSnap.docs) {
    legumbresDocs.push({
      id: doc.id,
      reason: "legumbres-category",
      data: doc.data(),
      ref: doc.ref,
    });
    if (!byId.has(doc.id)) {
      byId.set(doc.id, {
        id: doc.id,
        reason: "legumbres-category",
        data: doc.data(),
        ref: doc.ref,
      });
    }
  }

  return {
    chimichurriDocs: Array.from(byId.values()).filter((item) => {
      const sku = String(item.data?.sku || item.id || "").toUpperCase();
      return sku === TARGET_SKU || item.id.toUpperCase() === TARGET_SKU;
    }),
    legumbresDocs,
    allDocs: Array.from(byId.values()),
  };
}

function prepareMigrationDocs(allDocs) {
  const now = new Date().toISOString();
  return allDocs.map((entry) => {
    const currentCategory = entry.data?.categoryId;
    return {
      ...entry,
      currentCategory,
      needsUpdate: currentCategory !== DEFAULT_TARGET_CATEGORY,
      nextPayload: {
        categoryId: DEFAULT_TARGET_CATEGORY,
        updatedAt: now,
      },
    };
  });
}

function writeBackupFile(projectId, docs) {
  const backupDir = createBackupDir();
  const backupPath = path.join(
    backupDir,
    `phase1-backup-${projectId}-${buildTimestamp()}.json`,
  );

  const backupContent = {
    migration: "phase1-category-migration",
    projectId,
    createdAt: new Date().toISOString(),
    targetCategory: DEFAULT_TARGET_CATEGORY,
    docs: docs.map((doc) => ({
      id: doc.id,
      sku: doc.data?.sku ?? null,
      name: doc.data?.name ?? null,
      reason: doc.reason,
      before: {
        categoryId: doc.data?.categoryId ?? null,
        updatedAt: doc.data?.updatedAt ?? null,
      },
    })),
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupContent, null, 2));
  return backupPath;
}

async function applyMigration(db, projectId, docsToUpdate) {
  const backupPath = writeBackupFile(projectId, docsToUpdate);

  if (docsToUpdate.length === 0) {
    return { backupPath, updatedCount: 0 };
  }

  const batch = db.batch();
  for (const doc of docsToUpdate) {
    batch.set(doc.ref, doc.nextPayload, { merge: true });
  }
  await batch.commit();

  return {
    backupPath,
    updatedCount: docsToUpdate.length,
  };
}

async function applyRollback(db, rollbackFile, yesFlag) {
  if (!yesFlag) {
    throw new Error("Rollback requires --yes");
  }
  const absolutePath = path.resolve(rollbackFile);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Rollback file not found: ${absolutePath}`);
  }

  const backup = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const docs = Array.isArray(backup.docs) ? backup.docs : [];

  const batch = db.batch();
  for (const doc of docs) {
    const ref = db.collection(PRODUCTS_COLLECTION).doc(doc.id);
    const payload = {
      updatedAt:
        doc.before?.updatedAt === null || doc.before?.updatedAt === undefined
          ? FieldValue.delete()
          : doc.before.updatedAt,
      categoryId:
        doc.before?.categoryId === null || doc.before?.categoryId === undefined
          ? FieldValue.delete()
          : doc.before.categoryId,
    };
    batch.set(ref, payload, { merge: true });
  }

  await batch.commit();
  return { rollbackFile: absolutePath, restoredCount: docs.length };
}

function printPreview(projectId, docs, chimichurriDocs, legumbresDocs) {
  const rows = docs.map((doc) => ({
    id: doc.id,
    sku: doc.data?.sku ?? "",
    reason: doc.reason,
    from: doc.currentCategory ?? null,
    to: DEFAULT_TARGET_CATEGORY,
    needsUpdate: doc.needsUpdate,
    nameEs: doc.data?.name?.es ?? "",
  }));

  console.log(`\nProject: ${projectId}`);
  console.log(`Collection: ${PRODUCTS_COLLECTION}`);
  console.log(`Target category: ${DEFAULT_TARGET_CATEGORY}`);
  console.log(`Chimichurri docs found: ${chimichurriDocs.length}`);
  console.log(`Legumbres docs found: ${legumbresDocs.length}`);
  console.log(`Total unique docs in scope: ${docs.length}`);
  console.log("");
  console.table(rows);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const serviceAccount = resolveServiceAccount();
  const expectedProjectId = resolveExpectedProjectId(args.projectId);
  const { projectId, db } = initAdminApp(serviceAccount, expectedProjectId);

  if (args.rollbackFile) {
    console.log(`Executing rollback on project "${projectId}" ...`);
    const result = await applyRollback(db, args.rollbackFile, args.yes);
    console.log(
      `Rollback completed. Restored docs: ${result.restoredCount}. Source: ${result.rollbackFile}`,
    );
    return;
  }

  const { chimichurriDocs, legumbresDocs, allDocs } = await fetchTargetDocs(db);
  const migrationDocs = prepareMigrationDocs(allDocs);
  printPreview(projectId, migrationDocs, chimichurriDocs, legumbresDocs);

  const docsToUpdate = migrationDocs.filter((doc) => doc.needsUpdate);

  if (!args.apply) {
    console.log(
      `Dry-run only. Docs that would be updated: ${docsToUpdate.length}. Run with --apply --yes to execute.`,
    );
    return;
  }

  if (!args.yes) {
    throw new Error("Apply mode requires --yes");
  }

  console.log(`Applying migration on project "${projectId}" ...`);
  const result = await applyMigration(db, projectId, docsToUpdate);
  console.log(`Migration completed. Updated docs: ${result.updatedCount}`);
  console.log(`Backup written to: ${result.backupPath}`);
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
