# Auditoría Completa - GreenDolio (Fase 1)

Fecha de auditoría: 2026-02-13  
Repositorio: `/Users/aimac/Documents/GreenDolio-Pro copy 25`  
Rama: `main` (ahead `37` commits sobre `origin/main`)  
HEAD: `63598d40`

## 1) Resumen Ejecutivo

- **Estado actual para release en 5 días:** **NO-GO** (hoy) por mezcla de cambios no cerrados, múltiples errores de lint/typecheck y desalineación parcial entre estructura objetivo de categorías vs UI/flujo actual.
- **Firebase/Admin (riesgo crítico):** la migración de Fase 1 está aplicada correctamente en **staging** y verificada en dry-run; no se detectaron escrituras adicionales pendientes.
- **Principal gap funcional:** el menú y la home no implementan todavía la estructura final "Recién preparado" + "Catálogo" con filtros exactos de categorías.

---

## 2) Estado Local + Git

### 2.1 Estado del working tree

- Total entradas en `git status`: `98`
- Trackeados modificados: `41`
- Trackeados eliminados: `15`
- No trackeados: `42`

### 2.2 Distribución por área

- `web:assets-images` -> 23
- `web:admin-pages` -> 17
- `web:api-routes` -> 14
- `web:modules` -> 12
- `web:home-components` -> 11
- `docs` -> 7
- `api:dist` -> 3
- `scripts` -> 1
- `other` -> 10

### 2.3 Hallazgos git críticos

- `git remote -v` expone una URL con token embebido para `origin`.
  - Acción recomendada inmediata: revocar/rotar ese token y limpiar credenciales locales.
- Hay artefactos `dist` trackeados modificados:
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/dist/modules/catalog/schemas.d.ts`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/dist/modules/catalog/schemas.js`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/dist/modules/catalog/schemas.js.map`
- Se eliminaron componentes/rutas de combos y assets:
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/lunch-combos-section.tsx`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/admin/combos/page.tsx`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/api/catalog/combos/route.ts`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/api/admin/catalog/combos/route.ts`
- Hay imports hacia utilidades no trackeadas (riesgo de commit incompleto), por ejemplo:
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/lib/utils/generate-sku.ts` (no trackeado)

---

## 3) Firebase/Admin Safety Check

### 3.1 Proyecto apuntado

Service accounts encontrados:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/service-account.json` -> `greendolio-staging`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/service-account.json` -> `greendolio-staging`

### 3.2 Migración Fase 1 verificada

- Script: `/Users/aimac/Documents/GreenDolio-Pro copy 25/scripts/migrations/phase1-category-migration.mjs`
- Dry-run (staging) ejecutado hoy:
  - `GD-CASE-007` ya está en `otros`
  - `legumbres` con productos: `0`
  - `docs a actualizar`: `0`

Backup existente:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/data/backups/phase1-category-migration/phase1-backup-greendolio-staging-2026-02-13T02-35-16-796Z.json`

### 3.3 Riesgo de configuración

- En `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/.env.local` hay **dos** `NEXT_PUBLIC_FIREBASE_PROJECT_ID`:
  - línea 4: `greendolio-tienda`
  - línea 14: `greendolio-staging`
- Esto es propenso a errores de entorno y despliegue accidental.

---

## 4) Estructura Actual de Categorías

Fuente BD auditada: `catalog_categories` en `greendolio-staging`.

### 4.1 Categorías definidas en BD

| id | slug | status | order |
|---|---|---|---|
| cajas | cajas | active | 0 |
| productos-caseros | productos-caseros | active | 1 |
| jugos-naturales | jugos-naturales | active | 2 |
| productos-de-granja | productos-de-granja | active | 3 |
| otros | otros | active | 4 |
| frutas | frutas | active | 5 |
| legumbres | legumbres | null | 5 |
| vegetales | vegetales | active | 6 |
| hierbas-y-especias | hierbas-y-especias | active | 7 |
| ensaladas | ensaladas | active | 10 |
| ingredientes | ingredientes | active | 11 |

### 4.2 Categorías en menú/navegación actual

Definidas en:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/primary-nav.tsx:21`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/footer.tsx:38`

Menú actual:
- `Cajas` -> `/#cajas`
- `Ensaladas` -> `/#ensaladas`
- `Cómo Funciona` -> `/como-funciona`
- `Catálogo` -> `/#catalogo`
- `Nosotros` -> `/#confianza`

### 4.3 Categorías usadas en páginas

Home:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/page.tsx:71`
- Secciones: `cajas`, `ensaladas`, `catalogo`.

Recién preparado actual (parcial):
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/salads-section.tsx:31`
- Filtra **solo** `categoryId === "ensaladas"` y `type === "prepared"`.

Catálogo home:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/unified-catalog-section.tsx:17`
- Muestra todas las categorías excepto `cajas`.

Página de categoría:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/categoria/[slug]/page.tsx:33`
- Resuelve por `slug` y lista por `categoryId`.

### 4.4 Inconsistencias BD vs UI

1. La estructura final esperada pide menú `Recién preparado`, pero UI muestra `Ensaladas`.
2. `UnifiedCatalogSection` no restringe a `productos-de-granja`, `frutas`, `vegetales`, `hierbas-y-especias`, `otros`; hoy incluye también `ensaladas`, `ingredientes`, `productos-caseros`, `jugos-naturales` cuando tienen conteo.
3. Existe categoría `legumbres` en BD (status nulo) sin productos.
4. Existe categoría `ingredientes` en BD que aparece en home catalog (según conteo home) pero no es categoría pública deseada.

---

## 5) Productos y Categorización (BD actual)

### 5.1 Totales por categoría (raw, no ocultos)

- `vegetales`: 48
- `ingredientes`: 47
- `frutas`: 31
- `otros`: 16
- `hierbas-y-especias`: 13
- `ensaladas`: 7
- `productos-de-granja`: 6
- `productos-caseros`: 5
- `jugos-naturales`: 4
- `cajas`: 3
- sin categoría: 1

### 5.2 Productos en `productos-caseros`

- `GD-CASE-004` Baba Ganoush
- `GD-CASE-005` Hummus
- `GD-CASE-006` Guacamole
- `GD-ING-004` Ajo caramelizado
- `GD-ING-008` Dulce de leche

### 5.3 Productos en `jugos`

No existe `categoryId = "jugos"` actualmente. Sí existe `jugos-naturales` con:
- `GD-JUGO-008` Pepinada
- `GD-JUGO-009` Tropicalote
- `GD-JUGO-010` Rosa Maravillosa
- `GD-JUGO-011` China Chinola

### 5.4 Productos sin categoría o duplicados

Sin categoría:
- `GD-VEGE-012` Cebolla morada/amarilla (`categoryId = null`)

Duplicados por SKU:
- No detectados

Categorías duplicadas/anómalas por tipo:
- No se detectaron arrays/tipos inválidos en `categoryId`

---

## 6) Componentes Afectados (paths completos)

### 6.1 Menú principal

- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/primary-nav.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/footer.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/i18n/translations.ts`

### 6.2 Render de categorías en home

- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/page.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/salads-section.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/unified-catalog-section.tsx`

### 6.3 Página de catálogo/categoría

- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/categoria/[slug]/page.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`

### 6.4 Configuración de rutas/navegación

- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/primary-nav.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/api/catalog/categories/route.ts`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/api/catalog/products/route.ts`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/catalog/api.ts`

### 6.5 Componentes de filtrado por categoría

- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/salads-section.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/unified-catalog-section.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/admin/catalog/components/product-grid-manager.tsx`
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/lib/utils/generate-sku.ts`

---

## 7) Configuración Actual

### 7.1 Estructura de datos de productos (schema)

API schema:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/src/modules/catalog/schemas.ts:44`
- `productSchema` usa `categoryId: string`.
- `supplySchema` usa `minStock` (no `minStockAlert`).

Web types:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/catalog/types.ts`
- `Product.categoryId?: string`
- `Product.type?: "simple" | "box" | "salad" | "prepared"`

### 7.2 Lógica de filtrado existente

Storefront API pública:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/api/catalog/products/route.ts:8`
- Excluye internos: categoría `ingredientes` o SKU `GD-ING-` / `GD-INGR-`.

Home “Recién preparado” actual:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/salads-section.tsx:31`
- Solo `ensaladas`, no `jugos` ni dips.

Catálogo home:
- `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/unified-catalog-section.tsx:17`
- Excluye solo `cajas`.

### 7.3 Sistema de URLs/rutas para categorías

- Página dinámica por slug: `/categoria/[slug]`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/categoria/[slug]/page.tsx`
- Resolución: `category.slug` desde `catalog_categories`.
- Listado de productos en esa página: vía `/api/catalog/products` (filtrado “sellable”).

---

## 8) Dependencias Críticas por Nombre de Categoría

### 8.1 Hardcode crítico detectado

1. Mapeos visuales de categorías en home/categoría:
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/unified-catalog-section.tsx:21`
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx:35`

2. Filtrado específico de ensaladas:
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/app/_components/salads-section.tsx:31`
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/admin/catalog/components/product-grid-manager.tsx:172`

3. Generación SKU por categoría con mapa desactualizado (`caseros`, `hierbas`, `combos`, etc.):
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/lib/utils/generate-sku.ts:6`

4. Scripts de import/sync con slugs viejos o inconsistentes:
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/src/scripts/importFromNewCSV.ts:142`
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/scripts/sync-assets-db.ts:310`
   - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/api/src/modules/catalog/mock-data.ts:47`

### 8.2 Warnings de breaking changes

- `ProductType` no incluye `"combo"`, pero UI lo usa:
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx:83`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx:955`
- Build de web está en modo permisivo:
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/next.config.js` -> `typescript.ignoreBuildErrors: true`
  - `/Users/aimac/Documents/GreenDolio-Pro copy 25/apps/web/build.sh` -> fuerza exit `0` aun con fallos.
- `npm --workspace apps/web run lint` -> `197` problemas (`127` errores, `70` warnings).
- `npx tsc --noEmit` en `apps/web` -> múltiples errores de tipos (incluyendo rutas Next y componentes nuevos).
- `npm --prefix apps/api run build` -> **OK**.

---

## 9) Veredicto sobre el cambio propuesto

El cambio de IA/categorías que propones **sí es correcto a nivel de negocio** y simplifica la navegación para launch.

Pero en el estado actual del repo, para hacerlo “perfecto” y seguro de release, faltan cierres críticos:

1. Alinear navegación final (`Recién preparado`) y su contenido real (ensaladas + jugos + dips específicos).
2. Restringir catálogo home a las 5 categorías finales.
3. Normalizar slugs/mapeos hardcodeados en UI + scripts + SKU generator.
4. Cerrar errores de tipo/lint en archivos tocados por el cambio (mínimo smoke path storefront + admin catálogo).
5. Congelar entorno Firebase para evitar mezcla staging/prod por variables duplicadas.
