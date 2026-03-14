# Auditoría Completa de Status Actual

Fecha de auditoría: 2026-02-13

Scope ejecutado:
- Auditoría de archivos locales (`apps/web`, `apps/api`, `scripts`, `docs`)
- Auditoría de git (estado de rama, diferencias, riesgo de release)
- Verificación técnica (lint/build/typecheck)
- Lectura **solo-lectura** de Firestore (proyecto de credenciales detectado: `greendolio-staging`)

## 1) Resumen Ejecutivo

Estado general actual: **inestable para release** si se exige calidad de lint/types y consistencia de categorías.

Puntos críticos detectados:
- Worktree muy cargado: `84` cambios sin staging (`41 M`, `15 D`, `31 ??`) en `main`.
- Rama local adelantada `37` commits sobre `origin/main`.
- Navegación/home/catálogo no están alineados con la estructura final propuesta.
- `catalog_categories` y UI pública están desalineados (se muestran categorías internas/auxiliares en home).
- Build de `apps/web` pasa, pero está configurado para ignorar problemas reales (`ignoreBuildErrors` + `NEXT_DISABLE_ESLINT`).
- `eslint` y `tsc` fallan con alto volumen de errores.
- Hay secretos y credenciales versionados (alto riesgo operativo/seguridad).

## 2) Estado Git

Comando base: `git status --porcelain`

Métricas:
- Total entradas: `84`
- Modificados: `41`
- Eliminados: `15`
- Nuevos no trackeados: `31`
- Staged: `0`

Rama:
- Actual: `main`
- Tracking: `origin/main`
- Diferencia: `ahead 37, behind 0`

Archivos eliminados relevantes (cambio de modelo combos -> ensaladas):
- `apps/web/src/app/_components/lunch-combos-section.tsx`
- `apps/web/src/app/admin/combos/page.tsx`
- `apps/web/src/app/api/admin/catalog/combos/route.ts`
- `apps/web/src/app/api/admin/catalog/combos/[id]/route.ts`
- `apps/web/src/app/api/catalog/combos/route.ts`
- `apps/web/src/modules/admin/catalog/components/combo-manager.tsx`
- `apps/web/public/assets/images/combos/*`

Observación de calidad en diff:
- Trailing whitespace detectado en `apps/web/src/app/admin/orders/[id]/page.tsx`.

## 3) Estructura Actual de Categorías

## 3.1 Categorías en Firestore (lectura real)

Colección auditada: `catalog_categories`

Total categorías: `11`

Listado actual:
- `cajas`
- `productos-caseros`
- `jugos-naturales`
- `productos-de-granja`
- `otros`
- `frutas`
- `legumbres`
- `vegetales`
- `hierbas-y-especias`
- `ensaladas`
- `ingredientes`

Hallazgo de localización:
- `8/11` categorías tienen metadata incompleta (`name.es` faltante y/o descripciones vacías).

## 3.2 Categorías en menú/navegación (UI)

Menú principal (`apps/web/src/app/_components/primary-nav.tsx`):
- `/#cajas`
- `/#ensaladas`
- `/como-funciona`
- `/#catalogo`
- `/#confianza`

Footer (`apps/web/src/app/_components/footer.tsx`):
- `#cajas`
- `#ensaladas`
- `#catalogo`
- `#confianza`

## 3.3 Categorías usadas en páginas

Home (`apps/web/src/app/page.tsx`):
- Sección `#cajas`
- Sección `#ensaladas`
- Sección `#catalogo` via `UnifiedCatalogSection`

Catálogo home (`apps/web/src/app/_components/unified-catalog-section.tsx`):
- Solo excluye `cajas`
- No restringe a catálogo final
- Mapea visualmente: `frutas`, `vegetales`, `productos-caseros`, `productos-de-granja`, `jugos-naturales`, `hierbas-y-especias`, `otros`

Página categoría (`apps/web/src/app/categoria/[slug]/page.tsx`):
- Usa categorías de `/api/catalog/categories`
- Productos de `/api/catalog/products`

## 3.4 Inconsistencias BD vs UI

Inconsistencia crítica #1 (conteos en home vs catálogo público):
- `HomePage` usa `fetchProducts()` (`apps/web/src/modules/catalog/api.ts`) que no aplica filtro storefront estricto.
- `/api/catalog/products` sí filtra ingredientes/no vendibles (`apps/web/src/app/api/catalog/products/route.ts`).
- Resultado: home puede mostrar tarjetas de categorías con conteos que luego no coinciden al entrar a `/categoria/[slug]`.

Dato real replicado con dataset actual:
- Home (lógica actual) mostraría también `ingredientes` (47), `ensaladas` (7), `legumbres` (1).
- Catálogo público vendible no incluye `ingredientes` y no incluye `legumbres`.

Inconsistencia crítica #2 (estructura final propuesta no aplicada):
- Sigue existiendo `productos-caseros` en BD y UI.
- Sigue existiendo `jugos-naturales` en BD y UI.
- Sigue existiendo `legumbres` en BD.
- Menú aún muestra `Ensaladas` en vez de `Recién preparado`.

Inconsistencia crítica #3 (assets de categorías con mismatch de mayúsculas/minúsculas):
- Archivos reales: `apps/web/public/assets/images/categories/Frutas.png`, `Jugos.png`, `Otros.png`, `Vegetales.png`
- Código usa rutas minúsculas: `/assets/images/categories/frutas.png`, etc., en:
  - `apps/web/src/app/_components/unified-catalog-section.tsx`
  - `apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`
- En entornos Linux (case-sensitive) esto puede romper imágenes.

## 4) Productos y Categorización (Firestore real)

Colección auditada: `catalog_products`

Totales:
- Productos totales en colección: `181`
- Productos vendibles según lógica pública (`/api/catalog/products`): `86`

### 4.1 Conteo por categoría (colección completa)

- `vegetales`: 48
- `ingredientes`: 47
- `frutas`: 31
- `otros`: 14
- `hierbas-y-especias`: 13
- `ensaladas`: 7
- `productos-caseros`: 6
- `productos-de-granja`: 6
- `jugos-naturales`: 4
- `cajas`: 3
- `legumbres`: 1

### 4.2 Conteo por categoría (vendibles storefront)

- `vegetales`: 26
- `frutas`: 20
- `hierbas-y-especias`: 10
- `otros`: 7
- `ensaladas`: 7
- `productos-de-granja`: 5
- `productos-caseros`: 4
- `jugos-naturales`: 4
- `cajas`: 3

### 4.3 Productos en `productos-caseros`

IDs actuales:
- `GD-CASE-004` Baba Ganoush
- `GD-CASE-005` Hummus
- `GD-CASE-006` Guacamole
- `GD-CASE-007` Chimichurri
- `GD-ING-004` Ajo caramelizado
- `GD-ING-008` Dulce de leche

### 4.4 Productos en `jugos`

- `jugos`: `0`
- `jugos-naturales`: `4`
  - `GD-JUGO-008`
  - `GD-JUGO-009`
  - `GD-JUGO-010`
  - `GD-JUGO-011`

### 4.5 Productos sin categoría o con anomalías

- Sin categoría (`categoryId` vacío/null): `1`
  - `GD-VEGE-012`
- Referencias a categoría inexistente: `0`
- SKU duplicado: `0`
- Mismatch `doc.id != sku`: `1`
  - `id=GD-PROD-001`, `sku=GD-LEGU-001`, `categoryId=legumbres`

## 5) Componentes Afectados (paths completos)

Menú principal:
- `apps/web/src/app/_components/primary-nav.tsx`
- `apps/web/src/app/_components/footer.tsx`
- `apps/web/src/modules/i18n/translations.ts`

Render categorías home:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/_components/unified-catalog-section.tsx`
- `apps/web/src/modules/catalog/api.ts`

Página catálogo/categorías:
- `apps/web/src/app/categoria/[slug]/page.tsx`
- `apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`
- `apps/web/src/app/api/catalog/categories/route.ts`
- `apps/web/src/app/api/catalog/products/route.ts`

Rutas/navegación:
- `apps/web/src/app/como-funciona/page.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/_components/hero-section-client.tsx`

Filtrado por categoría:
- `apps/web/src/app/_components/salads-section.tsx`
- `apps/web/src/app/_components/unified-catalog-section.tsx`
- `apps/web/src/modules/admin/catalog/components/product-grid-manager.tsx`
- `apps/web/src/lib/utils/generate-sku.ts`

Admin/Firebase sensible:
- `apps/web/src/lib/firebase/admin.ts`
- `apps/web/src/app/api/admin/_utils/require-admin-session.ts`
- `apps/web/src/app/api/admin/catalog/products/route.ts`
- `apps/web/src/app/api/admin/catalog/products/[id]/route.ts`
- `apps/web/src/app/api/admin/catalog/boxes/route.ts`
- `apps/web/src/app/api/admin/catalog/boxes/[id]/route.ts`
- `apps/web/src/app/api/admin/migrate-salads-to-products/route.ts`

## 6) Configuración Actual

Schema de producto (frontend):
- `apps/web/src/modules/catalog/types.ts`
- `ProductType = "simple" | "box" | "salad" | "prepared"`

Schema de producto (API legacy):
- `apps/api/src/modules/catalog/schemas.ts`
- Incluye también `comboSchema` y `catalog_combos`

Lógica de filtrado pública:
- `apps/web/src/app/api/catalog/products/route.ts`
- Filtro aplicado:
  - status activo
  - precio > 0
  - excluye `ingredientes`
  - excluye prefijos SKU `GD-ING-` / `GD-INGR-`

Sistema URLs/rutas de categorías:
- `apps/web/src/app/categoria/[slug]/page.tsx`
- Resuelve categoría por `slug` desde `/api/catalog/categories`
- Filtra productos por `categoryId`

## 7) Dependencias Críticas por Nombre de Categoría

Dependencias directas detectadas:
- `cajas`:
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/_components/hero-section-client.tsx`
  - `apps/web/src/modules/admin/catalog/components/box-edit-drawer.tsx`
  - `apps/web/src/app/api/admin/upload-image/route.ts`
- `ensaladas`:
  - `apps/web/src/app/_components/salads-section.tsx`
  - `apps/web/src/modules/admin/catalog/components/product-grid-manager.tsx`
- `jugos-naturales`:
  - `apps/web/src/app/_components/unified-catalog-section.tsx`
  - `apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`
  - `apps/web/src/lib/utils/generate-sku.ts`
- `productos-caseros`:
  - `apps/web/src/app/_components/unified-catalog-section.tsx`
  - `apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`
- `hierbas-y-especias`:
  - `apps/web/src/app/_components/unified-catalog-section.tsx`
  - `apps/web/src/app/categoria/[slug]/_components/category-product-grid.tsx`
- `legumbres`, `hierbas`, `combos` (legacy/deuda):
  - `apps/web/src/lib/utils/generate-sku.ts`
  - `apps/web/src/app/api/admin/migrate-salads-to-products/route.ts`
  - `apps/api/src/modules/catalog/*` (combos)

Warning fuerte:
- `apps/web/src/lib/utils/generate-sku.ts` mapea `caseros`, no `productos-caseros`; cuando se auto-genera SKU para `productos-caseros` cae en prefijo genérico `PROD`.

Warning fuerte:
- `apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx` permite `option value="combo"`, pero `ProductType` no incluye `combo`.

## 8) Firebase/Admin: Riesgos y Seguridad

Guardrails positivos:
- Alineación de proyecto en admin SDK:
  - `apps/web/src/lib/firebase/admin.ts` valida `serviceAccount.project_id` contra `FIREBASE_PROJECT_ID/NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

Riesgos críticos:
- Credenciales versionadas en git:
  - `service-account.json`
  - `apps/web/service-account.json`
  - `apps/web/scripts/service-account.json`
  - `greendolio-staging-firebase-adminsdk-fbsvc-40c2cc2161.json`
- `.env.local` de raíz también está trackeado.
- URL de `origin` contiene token embebido (PAT) en `.git/config`.
- Múltiples scripts de mutación Firestore fuera de guardrails (`scripts/*`, `apps/web/scripts/*`, `apps/api/src/scripts/*`) usan `service-account.json` directo sin check de proyecto.

Warning de operación:
- Endpoint de migración activa con writes masivos:
  - `apps/web/src/app/api/admin/migrate-salads-to-products/route.ts`

## 9) Salud Técnica (Compilación/Lint)

Checks ejecutados:
- `npm --workspace apps/web run lint`
- `npm --workspace apps/web run build`
- `npm --workspace apps/web exec tsc --noEmit`
- `npm --prefix apps/api run build`
- `npm --prefix apps/api run lint`

Resultados:
- `apps/web lint`: **falla** (`197 problemas: 127 errores, 70 warnings`)
- `apps/web tsc`: **falla** (`137` errores TS)
- `apps/web build`: **pasa**, pero con bypasses:
  - `apps/web/build.sh` fuerza `NEXT_DISABLE_ESLINT=1`
  - `apps/web/next.config.js` tiene `typescript.ignoreBuildErrors = true`
  - `apps/web/build.sh` retorna `exit 0` incluso en escenarios de fallo filtrado
- `apps/api build`: **pasa**
- `apps/api lint`: **falla** (`42 problemas: 28 errores, 14 warnings`)

Conclusión técnica:
- El build “verde” actual no garantiza estabilidad real de release.

## 10) Evaluación del Cambio Propuesto (estructura final)

Propuesta funcionalmente correcta, pero requiere ejecución controlada porque hoy hay deuda estructural en categorías y filtros.

Cambio propuesto:
- Menú: `Cajas`, `Recién preparado`, `Catálogo`, `Cómo Funciona`, `Nosotros`
- Recién preparado: `Ensaladas`, `Jugos`, `Dips` (solo Baba Ganoush, Guacamole, Hummus)
- Catálogo: `Productos de Granja`, `Frutas`, `Vegetales`, `Hierbas y Especias`, `Otros`
- BD:
  - `GD-CASE-007`: `productos-caseros -> otros`
  - Producto `legumbres -> otros`

Veredicto:
- **Sí, el cambio es bueno y necesario** para simplificar UI + modelo comercial.
- **No debe ejecutarse “en caliente” sin plan de transición**, por riesgo alto de inconsistencias entre home/categoría/admin/scripts.

## 11) Bloqueadores de Release Prioritarios (orden sugerido)

1. Congelar/aislar mutaciones peligrosas de Firestore y limpiar secretos versionados.
2. Unificar fuente de verdad de categorías entre home y `/api/catalog/products`.
3. Implementar nuevo modelo de navegación/categorías y remover legado (`productos-caseros`, `jugos-naturales`, `legumbres`) en UI y utilidades.
4. Corregir assets de categorías con naming consistente case-sensitive.
5. Endurecer pipeline de build (sin `ignoreBuildErrors` ni bypass de lint).
6. Ejecutar migración BD mínima con rollback plan y validación post-migración.

## 12) Nota de Continuidad

Esta auditoría deja una base precisa para ejecutar los cambios finales sin romper Firebase/admin.
Siguiente paso recomendado: preparar plan de cambios por fases (DB -> API/filtros -> UI -> QA) y ejecutar en una rama de estabilización antes de deploy.
