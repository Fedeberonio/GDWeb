# Respuestas FAQ para Cursor - Green Dolio

---

## 1. ¿Existe algún sistema de internacionalización (i18n)? Si sí, ¿qué librería usan y dónde están los archivos de traducción?

**Sí.** El proyecto usa un sistema de i18n propio (sin librería externa como react-i18next).

**Archivos principales:**
- **`apps/web/src/modules/i18n/translations.ts`** — Todas las traducciones (es/en) en un objeto por locale
- **`apps/web/src/modules/i18n/context.tsx`** — `LanguageProvider` y `useLocale()` para el estado del idioma
- **`apps/web/src/modules/i18n/use-translation.ts`** — Hook `useTranslation()` con `t(key)` y `tData(localizedObject)`
- **`apps/web/src/modules/i18n/locales.ts`** — Locales soportados (`es`, `en`), labels y default

**Uso:**
```tsx
const { t, tData, locale } = useTranslation();
// t("hero.title") → "Ordena tu Cajita Fresca" (es) o "Order Your Fresh Box" (en)
// tData(product.name) → extrae es/en según locale
```

**Persistencia:** Cookie `gd-locale` (180 días).

**Admin:** Usa el mismo sistema. Las claves de admin están en `translations.ts` bajo `admin.*` (ej. `admin.box_manager.price`, `admin.user_badge.login`).

---

## 2. ¿Cuál es el componente/archivo que renderiza las cards de las cajas?

**Componente principal:** `BoxesGrid`  
**Archivo:** `apps/web/src/app/_components/boxes-grid.tsx`

Cada card de caja se renderiza con **`ProductCard`** (`apps/web/src/app/_components/product-card.tsx`) con `type="box"`.

**Flujo:**
- `page.tsx` (home) → `BoxesGrid` → `ProductCard` por cada caja
- `BoxesGrid` recibe: `boxes`, `prebuiltBoxes`, `products`, `boxRules`
- Las imágenes vienen de `getBoxImages(boxId)` o `box.heroImage`

---

## 3. ¿Cuál es el componente/archivo del hero de la landing page?

**Componente:** `HeroSectionClient`  
**Archivo:** `apps/web/src/app/_components/hero-section-client.tsx`

**Uso:** Se monta desde `HomePageClient` (`apps/web/src/app/_components/home-page-client.tsx`), que a su vez se usa en `page.tsx` (home).

**Contenido:** Imagen de fondo (`hero-lifestyle-kitchen.jpg`), gradientes overlay, badge, título, subtítulo y CTA "Ver Cajas Disponibles".

---

## 4. ¿Cuál es el componente/archivo de la sección "Cómo funciona"?

**Página:** `apps/web/src/app/como-funciona/page.tsx`  
**Componente principal:** `HowItWorksDetailed`  
**Archivo:** `apps/web/src/app/_components/how-it-works-detailed.tsx`

**Alternativas (no usadas en la ruta actual):**
- `HowItWorksModern` — `apps/web/src/app/_components/how-it-works-section-modern.tsx`
- `HowItWorksImage` — `apps/web/src/app/_components/how-it-works-image.tsx`

---

## 5. ¿Cuál es el componente/archivo que aparece cuando el usuario selecciona una caja (el modal o página de configuración)?

Hay dos flujos:

**a) Diálogo "¿Quieres personalizar tu caja?"**  
- **Componente:** `BoxAddModeDialog`  
- **Archivo:** `apps/web/src/app/_components/box-add-mode-dialog.tsx`  
- Se muestra al hacer clic en "Agregar" en una card de caja. Ofrece "Personalizar" o "Agregar directo".

**b) Modal de preferencias (gustos / no gustos)**  
- **Componente:** `BoxPreferencesModal`  
- **Archivo:** `apps/web/src/app/_components/box-preferences-modal.tsx`  
- Se abre al elegir "Personalizar" en el diálogo anterior. Permite elegir variante (Mix/Frutal/Veggie) y marcar ingredientes que gustan o se evitan.

**Subcomponentes relacionados:**
- `BoxVariantsDisplay` — `apps/web/src/app/_components/box-variants-display.tsx`
- `BoxSizeSelector`, `VariantSelector`, `BoxPreview` — `apps/web/src/app/_components/box-selector/`

**En Admin:** La edición de cajas se hace con `BoxEditDrawer` (`apps/web/src/modules/admin/catalog/components/box-edit-drawer.tsx`), no con los modales de preferencias del público.

---

## 6. ¿Cómo está implementado el badge actual de las cajas (el que dice "FLEXIBLE" o similar)?

**Ubicación:** `apps/web/src/app/_components/boxes-grid.tsx` (aprox. líneas 232–265)

**Lógica:**
- Si la caja tiene `BOX_DURATION_BADGE_BY_ID[box.id]` → se usa ese texto (ej. "3 DAYS", "1 WEEK", "2 WEEKS")
- Si tiene `box.durationDays` → se usa `"${durationDays} DÍAS"` (o equivalente traducido)
- Si no → se usa `t("boxes.flexible").toUpperCase()` → **"FLEXIBLE"**

**Traducción:** `translations.ts` — `"boxes.flexible": "FLEXIBLE"` (es) y `"boxes.flexible": "FLEXIBLE"` (en)

**Badges adicionales:**
- Índice 1: "MÁS POPULAR" (`boxes.badge_popular`)
- Índice 2: "MEJOR VALOR" (`boxes.badge_best_value`)
- Si `box.isFeatured`: badge "Destacado" (`category.featured`)

**Renderizado:** Los badges se pasan a `ProductCard` como prop `badges` y se muestran en la esquina superior derecha de la card.

---

## 7. ¿Cuál es el precio actual de cada caja en el código/base de datos?

**Origen:** Los precios vienen de **Firestore**, colección `catalog_boxes`. No hay precios hardcodeados en el frontend.

**Estructura en Firestore:**
```ts
price: { amount: number, currency: string }  // ej. { amount: 850, currency: "DOP" }
```

**Tipo:** `Box.price` en `apps/web/src/modules/catalog/types.ts`:
```ts
export type Price = { amount: number; currency: string };
```

**Uso en UI:** `box.price.amount` formateado como `RD$${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`

**Seed / migración:** El script `apps/web/scripts/seed-staging.mjs` lee precios de un CSV (`Precio_DOP`) y los escribe en Firestore. Los valores reales dependen de ese CSV o de lo que esté en la base.

**Para ver precios actuales:** Revisar los documentos en Firestore `catalog_boxes` (GD-CAJA-001, GD-CAJA-002, GD-CAJA-003) o el CSV usado por el seed.

**Edición en Admin:** Los precios se pueden cambiar desde `/admin/boxes` → editar caja → campo "Precio (DOP)" en `BoxEditDrawer`.

---

## 8. Admin — Resumen general

El admin usa el mismo i18n (`useTranslation`) y las mismas traducciones en `translations.ts` bajo la clave `admin.*` (ej. `admin.box_manager.price`, `admin.user_badge.login`).

### Rutas principales

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/admin` | `admin/page.tsx` | Dashboard |
| `/admin/boxes` | `admin/boxes/page.tsx` | Gestión de cajas |
| `/admin/box-rules` | `admin/box-rules/page.tsx` | Reglas de cajas |
| `/admin/products` | `admin/products/page.tsx` | Productos |
| `/admin/orders` | `admin/orders/page.tsx` | Pedidos |
| `/admin/orders/[id]` | `admin/orders/[id]/page.tsx` | Detalle de pedido |
| `/admin/customers` | `admin/customers/page.tsx` | Clientes |
| `/admin/settings` | `admin/settings/page.tsx` | Configuración |
| `/admin/supplies` | `admin/supplies/page.tsx` | Insumos |
| `/admin/finances` | `admin/finances/page.tsx` | Finanzas |
| `/admin/shopping` | `admin/shopping/page.tsx` | Compras consolidadas |

### Componentes de cajas en Admin

**Página de cajas:** `apps/web/src/app/admin/boxes/page.tsx`
- Usa `BoxGridManager` para listar y gestionar cajas.

**Componente de grid:** `apps/web/src/modules/admin/catalog/components/box-grid-manager.tsx`
- Lista y muestra las cajas.
- Abre `BoxEditDrawer` al editar una caja.

**Drawer de edición:** `apps/web/src/modules/admin/catalog/components/box-edit-drawer.tsx`
- Edita: nombre (es/en), descripción, precio, duración, imagen, variantes, highlights, contenido de referencia, etc.
- Guarda vía API `/api/admin/catalog/boxes/[id]` (PUT).

### APIs Admin usadas para cajas

- `GET /api/admin/catalog/products?type=box` — lista de cajas y productos.
- `PUT /api/admin/catalog/boxes/[id]` — actualizar caja (incluye precio).

### Protección

- `AdminGuard` (`apps/web/src/modules/admin/components/admin-guard.tsx`) — controla acceso al admin.
- Layout: `apps/web/src/app/admin/layout.tsx` — sidebar, header, breadcrumbs.
