# Current State of Truth Audit

## 1. Architecture Summary (Active Modules + Collections)

### Active Admin Modules (apps/web/src/app/admin)
- `page.tsx` (Dashboard)
- `orders/` (list + detail + create)
- `finances/`
- `customers/`
- `supplies/`
- `settings/`
- `products/`, `boxes/`, `combos/`, `box-rules/`, `requests/`, `history/`

### Firestore Collections Referenced (API routes + modules)
**From API routes (`apps/web/src/app/api/**/route.ts`):**
- `orders`
- `catalog_products`
- `catalog_boxes`
- `catalog_box_rules`
- `box_definitions`
- `catalog_history`
- `lunch_combos`
- `catalog_supplies`
- `box_builder_requests`
- `manual_sales`
- `users`
- `history`
- `order_activities`
- `system_settings` (doc `order_config`)

**From client/admin modules:**
- `catalog_supplies` (admin supplies page uses `onSnapshot`)
- `supply_logs` (stock adjustments are logged client-side)
- `product_stock_logs` (inventory logging via admin finalize + services)
- `orders/{id}/activities` subcollection (admin order activities)

### Active Order/Checkout Flow
- **Checkout UI:** `apps/web/src/app/checkout/checkout-client.tsx`
- **Order creation API:** `apps/web/src/app/api/orders/route.ts`
- **Admin orders API:** `apps/web/src/app/api/admin/orders/**`

---

## 2. Security Verdict

**Verdict: SECURE (email allowlist enforced on client + server)**

**Admin guard allowlist check (exact line):**
```ts
return allowedEmailsCache.has(user.email.toLowerCase());
```
From `apps/web/src/modules/admin/components/admin-guard.tsx`.

**Allowlist source:**
`apps/web/src/lib/config/env.ts` reads:
```ts
const emails = process.env.ADMIN_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS ?? "";
```
If empty, it falls back to the hardcoded default `greendolioexpress@gmail.com` and ensures it is always included.

**Expected env value:**
`NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` is expected to be a **comma-separated list of admin emails**.
Current repo value in `.env.local`:
```
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=greendolioexpress@gmail.com,fberon@gmail.com,alcantaramariel60@gmail.com
```

---

## 3. Supplies Logic (Insumos)

**Collection:** `catalog_supplies` (standalone collection)

**Supply fields expected (from `apps/web/src/modules/supplies/types.ts` + create flow):**
- `id`, `name`, `category` (`Packaging | Glass | Labels | Other`)
- `unit`, `supplier`, `imageUrl`, `notes`
- `unitPrice`, `currency`
- `stock`, `minStock`
- `isReturnable`
- `createdAt`, `updatedAt`

**UI Behavior (admin supplies page):**
- Real-time Firestore listener (`onSnapshot`) on `catalog_supplies`.
- Inline edits for `unitPrice` and `minStock` via `updateDoc`.
- Stock increment uses `runTransaction` and logs to `supply_logs`.
- Deletions remove the document from `catalog_supplies`.

---

## 4. Admin Modules Map (Data Loading)

**Orders** (`apps/web/src/app/admin/orders/...`):
- Client components (`"use client"`), data loaded via `useEffect` + `adminFetch`.
- No TODO/FIXME found in pages.

**Finances** (`apps/web/src/app/admin/finances/page.tsx`):
- Client component, `useEffect` calls `/api/admin/finances/summary`.
- No TODO/FIXME found.

**Customers** (`apps/web/src/app/admin/customers/page.tsx`):
- Client component, `useEffect` calls `/api/admin/customers`.
- No TODO/FIXME found.

**Supplies** (`apps/web/src/app/admin/supplies/page.tsx`):
- Client component, real-time Firestore `onSnapshot` (no API route used).
- No TODO/FIXME found.

---

## 5. Checkout & Orders Flow

### Frontend → Backend field alignment
**Checkout payload (`checkout-client.tsx` → `/api/orders`):**
- `contactName`, `contactPhone`, `contactEmail`, `address`, `deliveryZone`, `deliveryDay`, `notes`, `paymentMethod`, `items`

**Backend expects (`apps/web/src/app/api/orders/route.ts`):**
- Required: `contactName`, `contactPhone`, `items`
- Optional: `contactEmail`, `address`, `deliveryDay`, `deliveryZone`, `notes`, `paymentMethod`

✅ Fields align. There is **no Zod validation** in the API—validation is manual.

### WhatsApp flow status
WhatsApp redirection **is still active** after order creation (checkout generates WhatsApp URL and opens it). It is not replaced by a fully backend-only flow.

---

## 6. Broken Links / Ghost Files

- No `_legacy` or deleted imports detected by quick scan.
- No obvious failing imports found.
- Full verification would still require a TypeScript build or lint run.

---

## Action Items (Prioritized)

1. **Apply dynamic order settings everywhere**
   - Only admin PATCH uses settings now. `/api/orders` (public create), `/api/admin/orders` (manual create), and `/api/admin/orders/[id]/finalize` still calculate fees with hardcoded or partial logic.

2. **Align fee calculation in finalize route**
   - `finalize` uses a local `calculateTotals` and preserves delivery fee but does not calculate payment fee. Should use `calculateOrderTotals` + `loadOrderSettings`.

3. **Review WhatsApp flow**
   - WhatsApp redirect remains in checkout. If the product intends to move fully to Firestore-driven order processing, this should be revisited.

4. **Security/Rules check for client-side writes**
   - Supplies module writes directly to Firestore from the client (`catalog_supplies`, `supply_logs`). Ensure Firestore rules enforce admin-only writes.

5. **Consistency audit for payment method values**
   - Admin supports `transfer_popular`, `transfer_qik`, `transfer`, `cash`, `card`, `online`. Ensure backend and reporting logic handle all values consistently.
