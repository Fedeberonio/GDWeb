# Auditoría: Flujo de Pedidos y Admin (GreenDolio)

**Fecha:** 31 de enero de 2026  
**Alcance:** Ciclo de vida del pedido (checkout → API creación → admin/orders), UI de detalle de pedido, lógica financiera/stock (finalize/status), consistencia de datos (preferencias y pago).  
**Objetivo:** Resumen técnico para planificar mejoras UX/UI y refactor; **no se ha modificado código**.

---

## 1. MAPA FUNCIONAL (Happy Path)

### 1.1 Flujo desde “Confirmar Pedido” hasta “Admin marca Pagado”

1. **Cliente en Checkout** (`apps/web/src/app/checkout/`)
   - Usuario completa formulario (nombre, teléfono, dirección, día de entrega, método de pago, notas).
   - Opcional: puerta de auth (iniciar sesión o continuar como invitado); el draft se guarda en `sessionStorage` (`gd-checkout-draft`).
   - Click en **“Confirmar Pedido”** → validaciones (nombre, teléfono, dirección, día, método de pago, mínimo DOP 500 si no hay cajas).
   - Se muestra **resumen** (OrderSummaryView) y un solo CTA: **“Enviar por WhatsApp”**.

2. **Envío del pedido (handleSendOrder)**
   - Se persiste perfil del usuario (si está logueado) con `persistProfileFromCheckout`.
   - **POST `/api/orders`** con payload: `contactName`, `contactPhone`, `contactEmail`, `address`, `deliveryZone`, `deliveryDay`, `notes`, `paymentMethod` (mapeado: Cash→cash, Transferencia→transfer, Tarjeta→card, PayPal→online), `items` (cada item: type, slug, name, quantity, price, image, configuration/metadata).
   - La API (`apps/web/src/app/api/orders/route.ts`) valida, calcula subtotal, envío (DOP 100 en Martes/Jueves/Sábado), fee PayPal 10% si aplica, y escribe en Firestore `orders`: `status: "pending"`, `payment: { method, status: "pending" }`, `items` (id = `item.slug` o `item.id`), `totals`, `delivery` (address, window). **No se guarda `userId`**.
   - Respuesta: `{ success: true, id: docRef.id, data: { id } }`.
   - Con el `orderId` recibido, se construye el mensaje de WhatsApp (detalle de ítems, preferencias likes/dislikes, totales) y se abre `wa.me/18097537338?text=...`.
   - Se limpia el carrito, se elimina el draft y se redirige a `/` tras ~1,5 s.

3. **Admin: listado**
   - **GET `/api/admin/orders?limit=100`** (requiere sesión admin). Devuelve órdenes ordenadas por `createdAt` desc, serializando fechas.
   - En `admin/orders/page.tsx` se muestran tarjetas con id, cliente, total, fecha, entrega, estado y acciones: **Ver / Editar** (navega a `/admin/orders/[id]`) y **Eliminar**. El estado se cambia con un `<select>` que llama **PUT `/api/admin/orders/[id]/status`** con `{ status }`.

4. **Admin: detalle del pedido** (`admin/orders/[id]/page.tsx`)
   - Al entrar se hace **Promise.all** de:
     - **GET `/api/admin/orders/[id]`** → orden completa.
     - **GET `/api/admin/orders/[id]/activities`** → timeline de actividades (subcolección `orders/{id}/activities`).
     - **GET `/api/admin/orders/[id]/customer`** → datos de cliente (nombre, teléfono, email, totalOrders, totalSpent, likes/dislikes/variant si existe `userId` en la orden; como la orden no guarda `userId`, solo se rellena desde `delivery.address` y `guestEmail`).
   - **Estado del pedido:** el `<select>` de estado llama **PUT `/api/admin/orders/[id]/status`** con el nuevo `status`; la respuesta devuelve la orden actualizada (serializada).
   - **Marcar como pagado:** en la sección “Información de Pago” hay un select “Estado” (unpaid / paid / refunded) que llama **PATCH `/api/admin/orders/[id]`** con `paymentStatus` y/o `paymentMethod`. La API valida que no se pueda marcar `paid` si el pedido está `pending` o `cancelled`.

5. **Finalizar pedido (descontar stock)**
   - Si el pedido está `pending`, el botón **“Finalizar Pedido”** abre el modal `OrderDetailsModal` en modo `confirm`: se confirman/editan cliente, dirección, ventana de entrega e idioma del mensaje.
   - Al confirmar se llama **POST `/api/admin/orders/[id]/finalize`** con `items`, `delivery`, `customerName`, `customerPhone`, `language`. La ruta:
     - Lee la orden y filtra items `type === "product"`.
     - En **transacción**: comprueba stock en `catalog_products` por `item.id`, decrementa `metadata.stock` por cada ítem, actualiza la orden con `items`, `totals` recalculados, `status: "confirmed"`, y opcionalmente `delivery`, `metadata.language`, `delivery.address` (contactName/phone).
   - Respuesta: `{ success: true, message: "..." }` (no devuelve la orden; el cliente hace `loadOrderData()`).

6. **Resumen del happy path**
   - Cliente: Checkout → Confirmar → Resumen → Enviar por WhatsApp → POST /api/orders → WhatsApp abierto → Home.
   - Admin: Lista órdenes → Entra a detalle → (Opcional) Editar ítems en modo “Editar Items” y guardar borrador o “Confirmar y Finalizar” → “Finalizar Pedido” con modal → POST finalize → Stock descontado, estado `confirmed` → Cambiar estado y/o marcar “Pagado” vía PATCH.

---

## 2. REDUNDANCIA Y FRICCIÓN

### 2.1 UI redundante o confusa

- **Doble resumen en checkout:** En el paso de formulario hay un `<aside>` con “Tu carrito” (CartLine + OrderSummary). Al pasar a “resumen” (`showSummary`) se muestra solo OrderSummaryView y los botones. No hay duplicación de datos grave, pero el usuario ve “resumen” dos veces (sidebar y luego pantalla de revisión).
- **Dos formas de “editar” en detalle de pedido:**
  - **“Finalizar Pedido”** abre el modal en modo `confirm` (cliente, dirección, ventana, idioma) y al confirmar llama a `finalize`.
  - **“Editar”** junto a “Entrega” abre el mismo modal en modo `edit` y al guardar llama **PATCH** con solo `delivery` (no finalize). El mismo modal sirve para confirmar y para editar detalles; el texto del botón y el flujo pueden confundir.
- **Editar ítems vs Finalizar:** En pedido `pending` se puede “Editar Items” (buscar productos, cambiar cantidades, guardar borrador o “Confirmar y Finalizar”). El inline “Confirmar y Finalizar” hace **POST finalize** con `editedItems` sin pasar por el modal de confirmación (no envía delivery/customerName/customerPhone/language). Hay dos caminos a “finalizar”: uno con modal (datos completos) y otro desde el editor de ítems (solo ítems). Redundancia y riesgo de inconsistencias (ej. ventana de entrega no actualizada).
- **Información de pago duplicada conceptualmente:** En Firestore la orden se crea con `payment: { method, status }`. El admin actualiza `paymentStatus` y `paymentMethod` a nivel raíz (PATCH). El tipo `Order` tiene tanto `payment` (PaymentDetails) como `paymentStatus` y `paymentMethod`. La UI solo usa `paymentStatus` y `paymentMethod`. Órdenes antiguas solo tienen `payment`; no se normaliza en GET, por lo que para ellas `order.paymentStatus` es `undefined` y la UI muestra “Pendiente” (fallback `|| "unpaid"`). Doble fuente de verdad.

### 2.2 “Ghost logic” y código poco usado

- **`mapCartItemToOrderItem`** en `checkout-client.tsx` (líneas 641–651): definida pero **nunca usada**; el payload se construye inline en `handleSendOrder`.
- **Order type `payment`:** La interfaz define `payment: PaymentDetails` (method, status, transactionId). La creación escribe `payment: { method, status }` y el admin escribe `paymentStatus`/`paymentMethod`. Nada en el flujo actual lee `order.payment.status` o `order.payment.method`; todo usa los campos de nivel superior. Código/contrato duplicado.
- **DELETE orden con `restoreStock`:** La ruta DELETE usa `item.productId` para devolver stock. En **POST /api/orders** los ítems se guardan con `id: item.slug || item.id` y **no se asigna `productId`**. Por tanto, al eliminar una orden creada desde checkout, la rama que restaura stock **nunca se ejecuta** (siempre `item.productId` es undefined). Solo tendría efecto si en algún flujo se rellenara `productId` (p. ej. ítems añadidos desde admin, que usan `referenceId`/product.id).
- **Customer preferences en detalle:** El endpoint `/api/admin/orders/[id]/customer` obtiene likes/dislikes/variant del documento `users/{userId}`. Como **POST /api/orders no guarda `userId`**, todas las órdenes de checkout tienen `userId` undefined; el endpoint solo puede rellenar nombre/teléfono/email desde la orden. Las preferencias de perfil del usuario **nunca se muestran** para pedidos creados desde la web (solo si en el futuro se guardara userId).

### 2.3 Endpoints que se podrían unificar o simplificar

- **PATCH `/api/admin/orders/[id]`** hace muchas cosas: `items`, `deliveryFee`, `delivery`, `paymentStatus`, `paymentMethod`. Podría dividirse en:
  - PATCH solo para “detalles de entrega y pago” (delivery, paymentStatus, paymentMethod).
  - PUT o PATCH específico para “actualizar ítems y recalcular totales” (evitar mezclar con pago).
- **Finalize:** Hoy solo devuelve `{ success: true, message }`. Sería más simple para el cliente que devolviera la orden actualizada (como hace status PUT), así se evita un `loadOrderData()` extra.
- **GET order + GET activities + GET customer:** Tres llamadas en paralelo en cada carga del detalle. Podría existir un único GET que devuelva orden + actividades recientes + resumen de cliente (o al menos orden + actividades) para reducir round-trips y estados de carga.

---

## 3. CRÍTICA UX/UI (estética y jerarquía)

### 3.1 Página de detalle del pedido (`admin/orders/[id]/page.tsx`)

- **Jerarquía visual:** La información crítica (estado del pedido, total, método de pago, botón “Finalizar Pedido” o “Marcar como pagado”) está en la **columna derecha (sidebar)** junto con WhatsApp, pago, acciones rápidas, resumen e ítems. La columna izquierda tiene cliente (si hay) y timeline. Para un flujo “ver total → cambiar estado → marcar pagado” está bien que estado y pago estén juntos, pero:
  - El **total** aparece abajo en “Resumen”, no destacado arriba.
  - Las **preferencias** (likes/dislikes) solo se ven en la tarjeta “Cliente” si el endpoint customer devuelve datos (hoy rara vez para órdenes web) y dentro de cada ítem en “Items” vía `item.metadata` (variante; likes/dislikes están en metadata pero no se muestran explícitamente en la lista de ítems en modo lectura).
- **Preferencias por ítem:** En la lista de ítems (modo no edición) se muestra “Variante: …” para boxes desde `item.metadata.variant`. No hay línea explícita para “likes/dislikes” por ítem aunque esos datos están en `metadata` (vienen de `configuration` en checkout). La información más útil para preparar la caja (preferencias) no está resaltada.
- **Acciones principales:** “Finalizar Pedido” y el selector de estado están claros. El bloque de WhatsApp (número + mensaje + botón) es largo; podría colapsarse o acortarse. “Información de Pago” (badge + estado + método) está bien ubicada.
- **Impresión:** Hay un bloque “solo print” con Orden de Compra (logo, cliente, entrega, tabla de ítems, totales). Bien separado de la vista en pantalla.

### 3.2 Búsqueda / edición de ítems (POS)

- Al hacer “Editar Items” se muestra un buscador que filtra `availableProducts` por `name.es` y permite añadir productos (por `product.id` como `referenceId`). La lista es editable (cantidad, quitar ítem). Totales en vivo (subtotal, envío, total). Es funcional.
- **Fricción:** El dropdown de búsqueda se abre con `searchQuery` y `onFocus`; si hay muchos productos, no hay paginación ni límite visible. No se muestra precio en el listado de ítems en modo lectura (sí en edición). Las “Acciones rápidas” (Ver Orden de Compra, Ver Factura) están en la misma columna; no hay jerarquía clara entre “editar pedido” y “solo ver documento”.
- **Inconsistencia:** Al “Confirmar y Finalizar” desde el editor de ítems se llama a finalize solo con `items: editedItems`. El modal de confirmación (cliente, dirección, idioma) no se usa en ese camino; por tanto se puede finalizar sin revisar/actualizar esos datos.

---

## 4. DEUDA TÉCNICA Y RIESGOS

### 4.1 Condiciones de carrera

- **Finalize:** La ruta usa una transacción: lee orden, lee productos, comprueba stock, decrementa y actualiza orden. Si dos admins finalizan la misma orden a la vez, dos transacciones pueden leer el mismo stock y ambas restar; podría resultar stock negativo. Sería más seguro que la transacción también comprobara que el pedido sigue en `pending` antes de aplicar cambios y pasarlo a `confirmed`, y/o usar un lock/flag “finalizeInProgress” para evitar doble finalize.
- **Status:** PUT en `/status` es un update simple (last-write-wins). No hay optimistic locking; si dos pestañas cambian el estado, el último gana. Aceptable para estado, pero conviene tenerlo en cuenta.
- **PATCH orden (ítems):** Si un admin edita ítems y otro finaliza al mismo tiempo, no hay comprobación de versión; el último PATCH/finalize gana.

### 4.2 Estructura de datos en Firestore

- **Payment:** Se guarda `payment: { method, status }` al crear y además `paymentStatus` / `paymentMethod` al actualizar. Dos representaciones para lo mismo. Recomendación: elegir una (p. ej. solo campos raíz `paymentStatus` y `paymentMethod`) y normalizar en creación y en GET para compatibilidad con documentos antiguos.
- **Items:** En creación se usa `id: item.slug || item.id` y no `referenceId`. El tipo `OrderItem` en front exige `referenceId`; en la práctica muchas órdenes no lo tienen. Finalize usa `item.id` para buscar en `catalog_products`. Si los documentos de productos tienen como id el slug/sku, coincide; si usan auto-id, finalize fallaría para ítems de checkout. Conviene documentar o unificar: o bien `item.id` es siempre el id de documento de producto (y en creación se rellena desde catálogo), o bien se usa `referenceId` y finalize lee `referenceId || id`.
- **Subcolección `activities`:** Bien para timeline. No hay límite en GET; para órdenes con muchas actividades podría paginarse.
- **userId:** No guardado en POST /api/orders. Para historial, LTV y preferencias por usuario sería necesario guardar `userId` cuando el cliente esté autenticado y pasarlo en el payload (y en la API escribirlo en el documento de la orden).

### 4.3 Otros puntos

- **Params en rutas Next.js:** En `activities/route.ts` el tipo de `params` es `{ id: string }` pero en otros archivos se usa `params: Promise<{ id: string }>` y `await params`. En versiones recientes de Next.js los params pueden ser Promise; conviene homogeneizar y usar `await params` donde corresponda para evitar fallos en runtime.
- **Validación en finalize:** Solo se consideran ítems con `type === "product"` para stock. Los ítems tipo `box` no tocan stock de productos en esta ruta; si en el futuro las cajas consumen stock de productos, habría que extender la lógica.
- **DELETE y restoreStock:** Como `productId` no existe en ítems de checkout, la devolución de stock en DELETE no funciona para esas órdenes. Opciones: (1) En POST /api/orders, resolver slug → productId (o guardar productId cuando exista) para ítems que vengan del catálogo; (2) En DELETE, usar `item.id` (slug) si `productId` no existe y el catálogo está keyed por slug; (3) Documentar que “restore stock” solo aplica a ítems que tengan `productId`.

---

## 5. RESUMEN EJECUTIVO

| Área | Hallazgo principal |
|------|--------------------|
| **Happy path** | Flujo claro: Checkout → POST /api/orders → WhatsApp; Admin lista → detalle → finalize (modal o desde editor ítems) → status/pago vía PATCH. |
| **Redundancia** | Doble representación de pago (`payment` vs `paymentStatus`/`paymentMethod`); dos caminos para finalizar (modal vs editor ítems); modal usado tanto para confirmar como para editar. |
| **Ghost / bugs** | `mapCartItemToOrderItem` sin uso; restoreStock en DELETE inefectivo (falta `productId`); preferencias de cliente no mostradas (no se guarda `userId`). |
| **UX detalle** | Total y preferencias por ítem no destacados; preferencias de caja en metadata no mostradas en lista de ítems; búsqueda POS usable pero sin paginación. |
| **Consistencia** | Preferencias: en checkout se envían en `configuration`/metadata; en admin se leen de user profile (que no se vincula por falta de userId). Pago: creación escribe `payment`; admin lee/escribe `paymentStatus`/`paymentMethod`; GET no normaliza. |
| **Riesgos** | Posible carrera en finalize (stock); DELETE no restaura stock en órdenes de checkout; dependencia de que `catalog_products` use id = slug para finalize. |

Este documento sirve como base para priorizar limpieza de datos, refactor de APIs y mejoras de UX/UI en la siguiente fase.
