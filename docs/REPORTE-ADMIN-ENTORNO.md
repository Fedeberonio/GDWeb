# Reporte detallado: entorno de administración (Admin)

**Fecha:** 28 de enero de 2026  
**Alcance:** Solo descripción y estado actual; no se realizaron cambios en el código.

---

## 1. Resumen ejecutivo

El panel de administración es un **ERP interno** para Green Dolio: catálogo (productos, cajas, combos, reglas de cajas), insumos, pedidos, finanzas, historial de cambios, solicitudes del box-builder y configuración. La **autenticación** se hace por Firebase (Google). La lista de correos permitidos viene de `getAdminAllowedEmails()` en `lib/config/env.ts`, que actualmente devuelve un array fijo (p. ej. `greendolioexpress@gmail.com`); la variable `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` existe en el schema pero no se usa en esa función. Parte de la lógica vive en **rutas API de Next.js** (Firestore directo) y parte en la **API Express** (`apps/api`), con proxy desde Next.js solo en algunos casos (listado de pedidos, cambio de estado).

---

## 2. Funciones que tiene el admin en este momento

| Función | Descripción breve |
|--------|--------------------|
| **Dashboard** | Resumen: ventas del mes, pedidos pendientes, insumos críticos, clientes nuevos; conteos de productos, cajas, solicitudes (pendientes) y stock bajo; enlaces a Productos, Cajas, Solicitudes, Insumos; actividad reciente (últimos 5 eventos). |
| **Productos** | CRUD de productos del catálogo: listado en grid, filtros, edición en drawer, subida de imagen (upload). |
| **Cajas** | CRUD de cajas: grid, edición en drawer, imágenes, relación con productos. |
| **Combos** | CRUD de combos de almuerzo: listado, selección, edición (nombre, imagen, productos/precios). |
| **Reglas de cajas (Box rules)** | Listado y edición de reglas por caja (contenidos, restricciones). |
| **Insumos** | Gestión de insumos en Firestore (`catalog_supplies`): listado, filtros por categoría, búsqueda, crear/editar, stock mínimo, precio unitario, “registrar compra” (incremento de stock y log en `supply_logs`), subida de imagen. |
| **Pedidos** | Listado de pedidos (proxy a API Express), cambio de estado por pedido; detalle de pedido (datos, cliente, actividades, notas, WhatsApp, subida de imagen como actividad). |
| **Finanzas** | Resumen (ingresos, ventas del mes, etc.), venta manual (wizard con productos y total) e generación de facturas (por pedido o listado reciente). |
| **Historial** | Historial de cambios del catálogo (proxy a API Express: `GET /admin/catalog/history`). |
| **Solicitudes (Box builder)** | Listado de solicitudes del “armar caja”, cambio de estado (pendiente/approved/rejected). |
| **Configuración** | Pestañas Perfil, Empresa, Notificaciones; solo UI y textos “próximamente”, sin persistencia ni integración. |

---

## 3. Qué funciona y qué no

### 3.1 Funciona

- **Acceso y guard:**** Login con Google; comprobación de email permitido; redirección/negación si no es admin.
- **Dashboard:** Conteos y métricas (productos, cajas, solicitudes, pendientes, stock bajo; ventas del mes, pedidos pendientes, insumos críticos, clientes nuevos); actividad reciente. Las rutas de dashboard en Next usan Firestore (client SDK en summary/activity/metrics).
- **Productos:** Listado, edición, creación, subida de imagen; rutas en Next con Firestore Admin.
- **Cajas:** Listado, edición, imágenes; rutas en Next con Firestore Admin.
- **Combos:** Listado, edición; rutas en Next con Firestore Admin.
- **Box rules:** Listado y edición; ruta en Next con Firestore Admin.
- **Insumos:** Toda la gestión (CRUD, stock, compras, logs) contra Firestore desde el cliente; subida de imagen vía `/api/admin/storage/upload` (proxy a API Express).
- **Listado de pedidos:** Proxy desde Next a `GET {API_BASE}/admin/orders`; cambio de estado: proxy a `PUT {API_BASE}/admin/orders/:id/status`.
- **Finanzas:** Resumen y venta manual contra Firestore en Next; generador de facturas que llama a `/api/admin/orders` (proxy) para datos de pedidos.
- **Historial de catálogo:** Proxy a `GET {API_BASE}/admin/catalog/history`.
- **Solicitudes box-builder:** Listado y actualización de estado con Firestore Admin en Next.

### 3.2 No funciona o incompleto

- **Detalle de pedido (`/admin/orders/[id]`):**  
  La página pide en paralelo:
  - `GET /api/admin/orders/:id`
  - `GET /api/admin/orders/:id/activities`
  - `GET /api/admin/orders/:id/customer`  
  En **Next.js no existen** esas rutas; solo existen:
  - `GET /api/admin/orders` (proxy a la API)
  - `PUT /api/admin/orders/[id]/status` (proxy a la API)  
  La **API Express** sí expone `GET /:id`, `GET /:id/activities`, `POST /:id/activities`, `GET /:id/customer`. Por tanto, en la app web esas tres GET devuelven **404** y la página de detalle no puede cargar pedido, actividades ni cliente. El cambio de estado desde el detalle sí funciona porque usa la ruta PUT existente.

- **Añadir nota / registrar WhatsApp / subir imagen (actividad)** en el detalle del pedido:  
  Hacen `POST /api/admin/orders/:id/activities`. Esa ruta **no existe** en Next (no hay proxy), por lo que esas acciones fallan.

- **Configuración:** Solo maquetas; no hay backend ni persistencia.

- **Breadcrumbs:** La ruta `box-rules` no tiene etiqueta en `LABELS`; se muestra el segmento literal "box-rules".

---

## 4. Frontend: secciones y archivos/carpetas

### 4.1 Estructura de páginas (App Router)

Todas bajo `apps/web/src/app/admin/`:

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/admin` | `page.tsx` | Dashboard (métricas, resumen, actividad, enlaces). |
| `/admin/products` | `products/page.tsx` | Productos: carga datos y renderiza `ProductGridManager`. |
| `/admin/boxes` | `boxes/page.tsx` | Cajas: carga boxes + products y renderiza `BoxGridManager`. |
| `/admin/combos` | `combos/page.tsx` | Combos: carga combos y renderiza `ComboManager`. |
| `/admin/box-rules` | `box-rules/page.tsx` | Reglas de cajas: carga box-rules y renderiza `BoxRulesManager`. |
| `/admin/supplies` | `supplies/page.tsx` | Insumos: lógica en la misma página (Firestore, filtros, modales). |
| `/admin/orders` | `orders/page.tsx` | Listado de pedidos y cambio de estado. |
| `/admin/orders/[id]` | `orders/[id]/page.tsx` | Detalle de pedido (falla por rutas GET faltantes). |
| `/admin/finances` | `finances/page.tsx` | Finanzas: resumen, venta manual, generador de facturas. |
| `/admin/history` | `history/page.tsx` | Historial de cambios del catálogo. |
| `/admin/requests` | `requests/page.tsx` | Solicitudes del box-builder. |
| `/admin/settings` | `settings/page.tsx` | Configuración (solo UI). |

Layout común: `admin/layout.tsx` (sidebar, logo, navegación, breadcrumbs, `AdminUserBadge`, toast de bienvenida).

### 4.2 Sidebar vs acceso real

- **En el sidebar** (`SIDEBAR_LINKS` en `layout.tsx`): Dashboard, Productos, Cajas, Combos, Insumos, Pedidos, Finanzas, Historial, Configuración.  
- **No están en el sidebar:** “Solicitudes” (`/admin/requests`) y “Reglas de cajas” (`/admin/box-rules`). Se llega a ellas desde el **Dashboard** (enlaces “Revisar solicitudes” y “Gestionar cajas”; box-rules solo entrando a una caja o yendo directo a `/admin/box-rules`).

### 4.3 Módulos y componentes (admin)

- **`apps/web/src/modules/admin/`**
  - **`api/client.ts`:** `adminFetch` (añade Bearer con idToken de Firebase) y `getCurrentIdToken`.
  - **`components/`**
    - `admin-guard.tsx`: Comprueba usuario y email permitido; muestra login o “sin permiso”.
    - `admin-user-badge.tsx`: Muestra email/avatar del usuario.
    - `breadcrumbs.tsx`: Breadcrumbs a partir de `pathname`; usa `LABELS` (falta `box-rules`).
    - `image-upload-field.tsx`: Campo de subida; llama a `/api/admin/storage/upload` o `/api/admin/upload-image` según uso.
  - **`catalog/components/`**
    - `product-grid-manager.tsx`, `product-manager.tsx`, `product-edit-drawer.tsx`
    - `box-grid-manager.tsx`, `box-manager.tsx`, `box-edit-drawer.tsx`
    - `combo-manager.tsx`
    - `box-rules-manager.tsx`
  - **`finances/components/`**
    - `manual-sale-wizard.tsx`, `invoice-generator.tsx`
  - **`orders/types.ts`:** Tipos para detalle de pedido (actividad, cliente, etc.).

### 4.4 Rutas API de Next.js (admin)

Bajo `apps/web/src/app/api/admin/`:

- **Autenticación:** `_utils/require-admin-session.ts` (verifica Bearer, Firebase Admin, email en lista).
- **Dashboard:** `dashboard/summary`, `dashboard/metrics`, `dashboard/activity` (Firestore client en Next).
- **Catálogo:**  
  `catalog/products` (GET/POST), `catalog/products/[id]` (GET/PATCH/DELETE),  
  `catalog/boxes`, `catalog/boxes/[id]`,  
  `catalog/combos`, `catalog/combos/[id]`,  
  `catalog/box-rules`, `catalog/box-rules/[id]`,  
  `catalog/history` (GET, proxy a API Express).  
  Implementación en Next con Firestore Admin, salvo history (proxy).
- **Pedidos:** `orders` (GET, proxy a API), `orders/[id]/status` (PUT, proxy a API).  
  **No existen:** `orders/[id]`, `orders/[id]/activities`, `orders/[id]/customer` (ni GET ni POST).
- **Finanzas:** `finances/summary`, `finances/manual-sales` (Firestore en Next).
- **Box-builder:** `box-builder/requests` (GET), `box-builder/requests/[id]/status` (PATCH) (Firestore Admin en Next).
- **Storage/upload:** `storage/upload` (proxy a API Express `/admin/uploads`), `upload-image` (lógica en Next + Firestore).

### 4.5 API Express (apps/api) usada por el admin

- **`apps/api/src/app.ts`** monta:
  - `POST /api/admin/uploads` (uploads).
  - `GET/PUT /api/admin/orders`, `GET /api/admin/orders/:id`, `PUT /api/admin/orders/:id/status`, `GET/POST /api/admin/orders/:id/activities`, `GET /api/admin/orders/:id/customer`.
  - `GET /api/admin/catalog/history` (y resto de rutas admin de catálogo si las hay).
- El **middleware** de admin está en `apps/api/src/middleware/requireAdminSession.ts` (equivalente a verificar sesión admin).

El frontend admin usa **solo** las rutas de **Next.js** (`/api/admin/...`). Donde Next no tiene ruta (pedido por id, activities, customer), la petición no llega a la API Express y devuelve 404.

---

## 5. Archivos y carpetas que “manejan” el admin

| Área | Carpetas / archivos principales |
|------|----------------------------------|
| **Páginas** | `apps/web/src/app/admin/*.tsx`, `admin/orders/[id]/page.tsx`, `admin/*/page.tsx`. |
| **Layout** | `apps/web/src/app/admin/layout.tsx`. |
| **Guard y cliente API** | `modules/admin/components/admin-guard.tsx`, `modules/admin/api/client.ts`. |
| **Catálogo UI** | `modules/admin/catalog/components/*.tsx`. |
| **Finanzas UI** | `modules/admin/finances/components/*.tsx`. |
| **Tipos pedidos** | `modules/admin/orders/types.ts`. |
| **Rutas API Next** | `apps/web/src/app/api/admin/**/*.ts`. |
| **Backend Express (pedidos, history, uploads)** | `apps/api/src/modules/orders/admin-routes.ts`, `apps/api/src/modules/catalog/` (history), `apps/api/src/modules/uploads/`, `apps/api/src/middleware/requireAdminSession.ts`, `apps/api/src/app.ts`. |
| **Configuración** | `apps/web/src/lib/config/env.ts` (`getAdminAllowedEmails`, `NEXT_PUBLIC_API_BASE_URL`). |

---

## 6. Conclusión

- El admin cubre **catálogo, insumos, pedidos (listado y estado), finanzas, historial y solicitudes**, con **guard por email** y **Firebase**.
- **Funciona bien** todo lo que usa rutas existentes en Next (Firestore directo o proxy a Express): dashboard, productos, cajas, combos, box-rules, insumos, listado de pedidos, cambio de estado, finanzas, historial, requests.
- **No funciona** la página de **detalle de pedido** ni las acciones asociadas (nota, WhatsApp, imagen) porque en Next **faltan** las rutas proxy para `GET /api/admin/orders/:id`, `GET/POST /api/admin/orders/:id/activities` y `GET /api/admin/orders/:id/customer`. Añadir esos proxies en Next hacia la API Express resolvería el problema.
- **Configuración** es solo UI; **breadcrumbs** no tienen etiqueta para `box-rules`.

Este documento es solo descriptivo; no se ha modificado ningún archivo del proyecto.
