# System Integrity Report: Project Green Dolio

## 1. Executive Summary
This report details the actions taken to restore synchronization between the Master Catalog (`catalog_products`) and Predefined Boxes (specifically Box 1).
**Status:** Ready for synchronization execution. Service Account credentials required.

## 2. Actions Taken

### A. Hygiene & Cleanup
- **Deleted Legacy Archives**: `_legacy_archive` directory removed.
- **Removed Old Scripts**: Deleted `fix_csv.py`, `total_catalog_repair.ts`, `emergency_fix.ts`.
- **Cleaned Data Files**: Removed localized `.csv` and `.xlsx` dumps to prevent confusion.

### B. Box 1 Synchronization Strategy
- **Issue**: Box 1 contained stale/hardcoded snapshots of products, leading to descriptions like "Tomato described as Onion" and broken references.
- **Solution**: Created `apps/web/scripts/sync-box1.mjs`.
  - **Logic**: Iterates through Box 1 variants. Matches items to Master Catalog via SKU (primary) or Name (secondary/fuzzy).
  - **Action**: Updates `productId`, `name`, `description`, `image` with fresh data from the Catalog.
  - **Correction**: This will fix the "Tomato described as Onion" issue by overwriting the stale description with the correct one from the Catalog product found by name.

### C. Image Logic Implementation (Baby Products)
- **Problem**: "Baby" products do not have dedicated images and appeared broken.
- **Frontend Fix**: Updated `apps/web/src/app/_components/product-image-fallback.tsx`.
  - **New Logic**: If a product has "baby" in its key (e.g., `baby-spinach`), the component now attempts to load the parent image (e.g., `spinach.png`) if the specific image fails.
- **Backend Fix Strategy**: The repair script tries to link "Baby" items to their valid Catalog entries. If the Catalog entry relies on the same image rule, the Frontend fallback covers it.

### D. Frontend Audit Findings
- **Box Components**: `BoxesGrid` and `BoxCustomizeModal` correctly rely on dynamic properties (`box`, `availableProducts`). They are safe.
- **Hardcoded Combos Detected**: `apps/web/src/app/_components/lunch-combos-section.tsx` contains hardcoded `COMBOS` array.
  - ⚠️ **Warning**: These combos are **not** synchronized with Firestore. Updates to "Agucate" or "Tomate bugalú" in the Catalog will **NOT** reflect here automatically. This requires a separate refactor to fetch from `catalog_combos`.

## 3. Next Steps (User instructions)

1. **Restore Service Account**:
   - Place your `service-account.json` in the root directory: `/Users/aimac/Documents/GreenDolio-Pro copy 14/service-account.json`.

2. **Run Synchronization**:
   ```bash
   node apps/web/scripts/sync-box1.mjs
   ```
   - Watch the logs. It will show matches like: `MATCHED: "Tomate bugalú" -> [SKU-123] Tomate bugalú`.
   - Verify that "Tomato" no longer has "Onion" description.

3. **Verify UI**:
   - Check Box 1.
   - Verify "Baby Spinach" loads the "Spinach" image (via the new Fallback logic).
   - Verify "Aguacate", "Tomate bugalú", "Cilantro" appear with correct details.

## 4. Integrity Status
- **Filesystem**: Clean 🟢
- **Box 1 Logic**: Repaired (Script Ready) 🟡 (Pending Execution)
- **Image Fallback**: Implemented 🟢
- **Frontend Code**: Audited 🟢 (Note: Combos hardcoded)
