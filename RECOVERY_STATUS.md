# Recovery Status Report

**Generated:** 2026-02-04  
**Context:** Post-restore backup verification. Use this report to confirm features, structure, and configuration before resuming work.

---

## 1. Architecture & Modules Check

### 1.1 `apps/web/src/app/admin/` (Depth 1)

| Item | Type | Notes |
|------|------|--------|
| `box-rules/` | folder | page.tsx |
| `boxes/` | folder | page.tsx |
| `combos/` | folder | page.tsx |
| **`customers/`** | folder | page.tsx + [id]/page.tsx |
| **`finances/`** | folder | page.tsx |
| `history/` | folder | page.tsx |
| **`orders/`** | folder | page.tsx, [id]/, create/ |
| `products/` | folder | page.tsx |
| `requests/` | folder | page.tsx |
| `settings/` | folder | page.tsx |
| `supplies/` | folder | page.tsx |
| `layout.tsx` | file | Admin layout |
| `page.tsx` | file | Admin dashboard |

**Result:** ✅ **finances**, **customers**, and **orders** are present under admin.

---

### 1.2 `apps/web/src/modules/` (Depth 1)

| Module | Purpose |
|--------|---------|
| `admin/` | API client, catalog components (box/product edit, combos), admin guard, finances (invoice, manual sale), orders types |
| `auth/` | Auth modal, context |
| `box-builder/` | Context, state, types |
| `cart/` | Context, Firestore sync, types |
| `catalog/` | API, context, localization, types |
| `i18n/` | Context, locales, translations, useTranslation |
| `orders/` | Types |
| `supplies/` | Types |
| `user/` | Context, Firestore, onboarding, profile modal, types |

**Result:** ✅ Front-end feature modules are present and aligned with admin areas.

---

### 1.3 `apps/api` existence and `apps/api/src/modules/`

**apps/api exists:** ✅

| Module | Contents |
|--------|----------|
| `boxBuilderRequests/` | admin-routes, repository, schemas, service |
| `boxes/` | routes, rules |
| `catalog/` | admin-routes, history, mock-data, repository, routes, schemas, service |
| `orders/` | admin-routes, public-routes, repository, schemas, service |
| `uploads/` | routes |
| `users/` | schemas |

**Result:** ✅ API modules match expected backend surface (catalog, orders, boxes, box-builder requests, uploads, users).

---

## 2. Assets Integrity Check

### 2.1 `apps/web/public/assets/images/products/`

- **Naming pattern:** New SKU system in use.
- **Examples:** `GD-FRUT-024.png`, `GD-VEGE-044.png`, `GD-ING-001.png`, `GD-JUGO-008.png`, `GD-CASE-004.png`, `GD-HIER-070.png`, `GD-GRAN-012.png`, `GD-OTRO-017.png`.
- **Exceptions:** `placeholder.png`, `temp-unknown-product-1.png`, and one lowercase `gd-frut-087.png` (minor inconsistency).
- **No old-style names** such as `Tomate.jpg` found.

**Result:** ✅ **New SKU system** (e.g. `GD-FRUT-001.png`) is in place; legacy product image naming is not present.

---

### 2.2 `apps/web/public/assets/icons`

**Exists:** ✅

- `icons/how_it_works/` — 01–06 step images (choose box, variety, personalize, add products, confirm, delivery).
- `icons/payment_methods/` — 01–04 (cash, bank transfer, credit card, PayPal).

**Result:** ✅ Icons directory and expected subfolders are present.

---

## 3. Design System Baseline

### 3.1 `apps/web/tailwind.config.js`

**Colors (theme.extend.colors.gd):**

| Token | Source |
|-------|--------|
| `forest` | var(--gd-color-forest) |
| `leaf` | var(--gd-color-leaf) |
| `olive` | var(--gd-color-olive) |
| `beige` | var(--gd-color-beige) |
| `orange` | var(--gd-color-orange) |
| `red` | var(--gd-color-red) |

**Font families (theme.extend.fontFamily):**

| Key | Value |
|-----|--------|
| `sans` | var(--font-open-sans) |
| `display` | var(--font-montserrat) |
| `script` | var(--font-railey), cursive |

**Result:** ✅ Tailwind theme uses CSS variables for gd colors and three font roles (sans, display, script).

---

### 3.2 `apps/web/src/app/globals.css`

**Font overrides with `!important`:**

- **Headings:** `h1, h2, h3` use `font-family: var(--font-railey), cursive !important` and `text-transform: none !important`.
- **Category label:** `.category-label` uses `font-family: var(--font-railey), cursive !important` and `text-transform: none !important`.
- **Next.js dev tools:** `nextjs-portal { display: none !important; }` (unrelated to fonts).

**Result:** ✅ Forced `!important` font overrides are present for headings and category labels (Railey + no transform). Body uses `var(--gd-font-sans)` without `!important`.

---

## 4. Git & Configuration Status

### 4.1 `git status`

- **Branch:** `test-build`
- **State:** Many changes staged (“Changes to be committed”), including:
  - Deleted: `.vercelignore`, `Dockerfile`, and some legacy scripts moved to `_legacy_archive/`.
  - New: `HANDOFF_STATUS.md`, various files under `_legacy_archive/`.
  - Many `node_modules` changes (additions/deletions) — typical after restore or reinstall.

**Result:** ✅ Repo is connected; current branch is **test-build** with a large staged set (handoff/cleanup and node_modules).

---

### 4.2 `git remote -v`

- **Remote:** `origin`
- **URL:** Points to **GitHub** repository **Fedeberonio/GDWeb** (fetch and push).

**Result:** ✅ Remote is configured; single origin to GDWeb repo.

---

## 5. Critical Features Presence

### 5.1 `DeliveryZoneCheck.tsx`

- **Path checked:** `apps/web/src/app/_components/sections/DeliveryZoneCheck.tsx`
- **Result:** ❌ **File does not exist.**

**Note:** Delivery zone logic is implemented elsewhere:
- `home-sections.tsx`: delivery windows, zone badges (Juan Dolio, Boca Chica, San Pedro), and delivery copy.
- `checkout-client.tsx`: `deliveryZone`, `deliveryDay`, and form handling.
- Translations: `checkout.delivery_zone`, `cart.delivery_zone`, `home.zone_*`, etc.

So “delivery zone” as a feature is present; only a dedicated component named `DeliveryZoneCheck.tsx` is missing.

---

### 5.2 `HowItWorksSection.tsx`

- **Path checked:** `apps/web/src/app/_components/sections/HowItWorksSection.tsx`
- **Result:** ❌ **File does not exist.**

**Note:** “How it works” is implemented under different names:
- `apps/web/src/app/_components/how-it-works-image.tsx` — component `HowItWorksImage` (used on home `page.tsx`).
- `apps/web/src/app/como-funciona/page.tsx` — full “Cómo funciona” page using `assets/icons/how_it_works/` and translations `how_it_works.*`.

So the “How it works” section and page exist; only a component named `HowItWorksSection.tsx` is absent.

---

## Summary Table

| Area | Status | Notes |
|------|--------|--------|
| Admin (finances, customers, orders) | ✅ | All present under `app/admin/` |
| Web modules | ✅ | admin, auth, box-builder, cart, catalog, i18n, orders, supplies, user |
| API + modules | ✅ | catalog, orders, boxes, boxBuilderRequests, uploads, users |
| Product images (SKU) | ✅ | New SKU naming (GD-*-*.png); no old “Tomate.jpg” style |
| Assets/icons | ✅ | how_it_works + payment_methods present |
| Tailwind (colors/fonts) | ✅ | gd colors + sans/display/script fonts |
| globals.css fonts | ✅ | !important on h1–h3 and .category-label (Railey) |
| Git branch | ✅ | test-build |
| Git remote | ✅ | origin → Fedeberonio/GDWeb |
| DeliveryZoneCheck.tsx | ❌ | Missing; logic lives in home-sections + checkout |
| HowItWorksSection.tsx | ❌ | Missing; equivalent: how-it-works-image.tsx + como-funciona page |

---

## Recommendations

1. **Safe to resume:** Architecture, admin areas, API, assets, and design system are consistent with a modern GreenDolio setup. You can resume work on this backup.
2. **Optional:** If the project explicitly expects `DeliveryZoneCheck.tsx` or `HowItWorksSection.tsx`, consider adding thin wrappers that re-export or delegate to the existing implementations (`home-sections`/checkout and `HowItWorksImage`/`como-funciona`) to satisfy naming conventions or imports.
3. **Git:** Resolve staged changes (e.g. commit handoff/cleanup or unstage node_modules) and sync with remote when ready; confirm with team before pushing from `test-build`.
