# AUDITORÍA COMPLETA: INVENTARIO E INSUMOS
## Sistema GreenDolio - Estado Actual

**Fecha:** 2026-02-04  
**Objetivo:** Documentación técnica completa del sistema de inventario e insumos para evaluación y mejoras por ingeniería.

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Datos en Firebase](#2-arquitectura-de-datos-en-firebase)
3. [Sistema de Inventario de Productos](#3-sistema-de-inventario-de-productos)
4. [Sistema de Gestión de Insumos](#4-sistema-de-gestión-de-insumos)
5. [Relación Productos-Insumos (Bill of Materials)](#5-relación-productos-insumos-bill-of-materials)
6. [Flujos de Actualización de Stock](#6-flujos-de-actualización-de-stock)
7. [Validaciones y Restricciones](#7-validaciones-y-restricciones)
8. [Logs y Auditoría](#8-logs-y-auditoría)
9. [Interfaz de Usuario (Admin)](#9-interfaz-de-usuario-admin)
10. [Puntos Críticos y Oportunidades de Mejora](#10-puntos-críticos-y-oportunidades-de-mejora)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual

El sistema GreenDolio gestiona **dos tipos de inventario**:

1. **Inventario de Productos** (`catalog_products`)
   - Stock almacenado en `metadata.stock` (número entero)
   - Stock mínimo en `metadata.minStock` (opcional)
   - Se decrementa automáticamente al finalizar pedidos
   - Se restaura al eliminar pedidos (opcional)

2. **Inventario de Insumos** (`catalog_supplies`)
   - Stock almacenado en `stock` (número entero)
   - Stock mínimo en `minStock` (número entero)
   - Se incrementa manualmente mediante "Registrar compra"
   - Logs de cambios en `supply_logs`

### 1.2 Tecnologías Utilizadas

- **Base de Datos:** Firebase Firestore
- **Frontend:** Next.js 16.1.4 (React 19)
- **Backend:** Next.js API Routes + Express API (legacy)
- **Autenticación:** Firebase Auth
- **Transacciones:** Firestore Transactions (para operaciones atómicas)

### 1.3 Colecciones Firebase Principales

| Colección | Propósito | Stock Field |
|-----------|-----------|-------------|
| `catalog_products` | Productos del catálogo | `metadata.stock` |
| `catalog_supplies` | Insumos (empaques, botellas, etc.) | `stock` |
| `supply_logs` | Historial de cambios de stock de insumos | N/A |
| `orders` | Pedidos (contiene snapshot de productos) | N/A |

---

## 2. ARQUITECTURA DE DATOS EN FIREBASE

### 2.1 Colección: `catalog_products`

**Ubicación:** `apps/web/src/modules/catalog/types.ts`

```typescript
type Product = {
  id: string;                    // ID único (ej: "GD-FRUT-001")
  slug: string;                  // Slug URL-friendly
  sku?: string;                  // SKU opcional
  name: LocalizedString;         // { es: "...", en: "..." }
  description?: LocalizedString;
  price: number;                  // Precio en DOP
  salePrice?: number;
  status: "active" | "inactive" | "coming_soon" | "discontinued" | "hidden";
  isActive: boolean;             // Legacy, usar status
  categoryId?: string;
  image?: string;
  tags?: string[];
  isFeatured?: boolean;
  
  // ⚠️ INVENTARIO: Stock almacenado aquí
  metadata?: {
    slotValue?: number;           // Valor de slot para box builder
    wholesaleCost?: number;       // Costo mayorista
    stock?: number;               // ⭐ STOCK ACTUAL (entero)
    minStock?: number;             // ⭐ STOCK MÍNIMO (entero, opcional)
    billOfMaterials?: Array<{     // ⭐ Relación con insumos
      supplyId: string;
      name: string;
      quantity: number;
    }>;
  };
  
  nutrition?: { ... };
  logistics?: { ... };
};
```

**Campos de Stock:**
- `metadata.stock`: Número entero, representa unidades disponibles
- `metadata.minStock`: Número entero, umbral para alertas
- **Valor por defecto:** Si `metadata.stock` es `undefined` o `null`, se trata como `0`

**Validación en Schema (API):**
- `apps/api/src/modules/catalog/schemas.ts` - El schema de Zod **NO valida** `stock` ni `minStock` explícitamente
- Usa `.passthrough()` en `metadata`, permitiendo campos adicionales

### 2.2 Colección: `catalog_supplies`

**Ubicación:** `apps/web/src/modules/supplies/types.ts`

```typescript
type Supply = {
  id: string;                    // ID único (ej: "caja-box1")
  name: string;                  // Nombre del insumo
  category: "Packaging" | "Glass" | "Labels" | "Other";
  unit?: string;                 // "und", "kg", "mts"
  supplier?: string;             // Proveedor
  imageUrl?: string;
  unitPrice?: number;            // Precio unitario en DOP
  currency?: string;             // "DOP"
  
  // ⚠️ INVENTARIO: Stock almacenado aquí
  stock: number;                 // ⭐ STOCK ACTUAL (entero, requerido)
  minStock: number;              // ⭐ STOCK MÍNIMO (entero, requerido)
  
  isReturnable: boolean;         // Si es retornable (botellas, frascos)
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
```

**Campos de Stock:**
- `stock`: Número entero, **requerido** (no opcional)
- `minStock`: Número entero, **requerido** (no opcional)
- **Valor por defecto:** Al crear, si no se especifica, se usa `0` para stock y `10` (retornables) o `20` (no retornables) para minStock

**Validación en Schema (API):**
- `apps/api/src/modules/catalog/schemas.ts` - Schema de Zod define:
  ```typescript
  stock: z.number().int().nonnegative().optional()
  minStockAlert: z.number().int().nonnegative().optional()
  ```
  - ⚠️ **INCONSISTENCIA:** El schema usa `minStockAlert` pero el tipo TypeScript usa `minStock`
  - ⚠️ **INCONSISTENCIA:** El schema marca `stock` como opcional, pero el tipo lo requiere

### 2.3 Colección: `supply_logs`

**Ubicación:** Creada dinámicamente en `apps/web/src/app/admin/supplies/page.tsx`

```typescript
// Estructura del log (no hay tipo TypeScript definido)
{
  supplyId: string;              // ID del insumo
  delta: number;                 // Cantidad agregada (positivo)
  previousStock: number;         // Stock antes del cambio
  newStock: number;              // Stock después del cambio
  actorEmail: string | null;     // Email del usuario que hizo el cambio
  createdAt: Timestamp;          // Firebase serverTimestamp()
}
```

**Características:**
- Solo se crea cuando se **incrementa** stock (registrar compra)
- **NO se crea** cuando se edita stock manualmente desde el modal de edición
- **NO se crea** cuando se decrementa stock (no hay flujo de decremento automático)

### 2.4 Colección: `orders`

**Ubicación:** `apps/web/src/modules/orders/types.ts`

```typescript
type Order = {
  id: string;
  status: OrderStatus;
  paymentStatus: "paid" | "unpaid";
  paymentMethod: string;
  userId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  items: OrderItem[];            // Snapshot de productos al momento de la orden
  totals: OrderTotals;
  delivery: { ... };
};

type OrderItem = {
  id: string;                    // ID del producto (productId o slug)
  productId: string;            // ID del producto en catalog_products
  type: "product" | "box";
  name: LocalizedString;
  quantity: number;              // ⭐ Cantidad pedida
  unitPrice: Price;              // Precio al momento de la orden
  startPrice: Price;             // Precio inicial (backup)
  metadata?: Record<string, unknown>;
};
```

**Nota Importante:**
- Los pedidos contienen un **snapshot** de los productos al momento de creación
- El stock se decrementa **solo cuando se finaliza** el pedido (no al crearlo)
- Si se elimina un pedido, se puede restaurar el stock con `?restoreStock=true`

---

## 3. SISTEMA DE INVENTARIO DE PRODUCTOS

### 3.1 Ubicación del Stock

**Campo:** `metadata.stock` en documento `catalog_products/{productId}`

**Acceso en Código:**
```typescript
const currentStock = productData.metadata?.stock ?? 0;
```

### 3.2 Visualización en Admin

**Archivo:** `apps/web/src/modules/admin/catalog/components/product-grid-manager.tsx`

```typescript
// Muestra badge de stock si existe
{typeof product.metadata?.stock === "number" && (
  <div className={product.metadata.stock <= (product.metadata.minStock ?? 0)
    ? "bg-red-100 text-red-700"  // Stock bajo
    : "bg-white/80"                // Stock normal
  }>
    Stock: {product.metadata.stock}
  </div>
)}
```

**Características:**
- Muestra stock solo si `metadata.stock` es un número
- Alerta visual (rojo) si `stock <= minStock`
- No hay edición inline de stock en productos (solo en insumos)

### 3.3 Actualización de Stock

#### 3.3.1 Decremento Automático (Finalizar Pedido)

**Archivo:** `apps/web/src/app/api/admin/orders/[id]/finalize/route.ts`

**Flujo:**
1. Admin finaliza pedido desde `/admin/orders/[id]`
2. Se llama `POST /api/admin/orders/[id]/finalize`
3. **Transacción Firestore:**
   ```typescript
   await db.runTransaction(async (transaction) => {
     // 1. Leer orden
     const orderDoc = await transaction.get(orderRef);
     
     // 2. Filtrar solo productos (no boxes)
     const productItems = items.filter((item) => item.type === "product");
     
     // 3. Leer productos desde catalog_products
     const productDocs = await transaction.getAll(...productRefs);
     
     // 4. Validar stock disponible
     productDocs.forEach((doc) => {
       const currentStock = productData.metadata?.stock ?? 0;
       if (currentStock < requestedItem.quantity) {
         throw new Error(`Stock insuficiente...`);
       }
     });
     
     // 5. Decrementar stock
     productItems.forEach((item) => {
       transaction.update(productRef, {
         "metadata.stock": FieldValue.increment(-item.quantity)
       });
     });
     
     // 6. Actualizar orden a "confirmed"
     transaction.update(orderRef, { status: "confirmed", ... });
   });
   ```

**Características:**
- ✅ Usa transacciones (atómico)
- ✅ Valida stock antes de decrementar
- ✅ Solo afecta productos (`type === "product"`), no boxes
- ✅ Usa `FieldValue.increment()` para evitar race conditions
- ⚠️ **NO crea logs** de cambios de stock

#### 3.3.2 Restauración de Stock (Eliminar Pedido)

**Archivo:** `apps/web/src/app/api/admin/orders/[id]/route.ts` (DELETE)

**Flujo:**
1. Admin elimina pedido con parámetro `?restoreStock=true`
2. Se llama `DELETE /api/admin/orders/[id]?restoreStock=true`
3. **Transacción Firestore:**
   ```typescript
   await db.runTransaction(async (transaction) => {
     const orderSnap = await transaction.get(orderRef);
     const orderData = orderSnap.data();
     
     if (restoreStock && Array.isArray(orderData?.items)) {
       for (const item of orderData.items) {
         const productId = item.productId || item.id;
         if (productId && item.quantity > 0) {
           const productRef = db.collection("catalog_products").doc(productId);
           transaction.update(productRef, {
             "metadata.stock": FieldValue.increment(item.quantity)
           });
         }
       }
     }
     
     transaction.delete(orderRef);
   });
   ```

**Características:**
- ✅ Usa transacciones (atómico)
- ✅ Opcional (requiere `?restoreStock=true`)
- ✅ Restaura cantidad exacta del pedido
- ⚠️ **NO valida** si el pedido fue finalizado antes (puede restaurar stock de pedidos nunca finalizados)
- ⚠️ **NO crea logs** de restauración

#### 3.3.3 Edición Manual (Admin)

**Archivo:** `apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx`

**Flujo:**
- Admin edita producto desde `/admin/products`
- Puede modificar `metadata.stock` y `metadata.minStock` en el formulario
- Se guarda mediante `PUT /api/admin/catalog/products/[id]`
- ⚠️ **NO hay validación** de stock mínimo antes de guardar
- ⚠️ **NO crea logs** de cambios manuales

### 3.4 Validaciones de Stock

#### 3.4.1 Al Finalizar Pedido

✅ **Validación Implementada:**
- Verifica que `currentStock >= requestedQuantity`
- Lanza error si no hay suficiente stock
- Previene finalización si falta stock

**Código:**
```typescript
const currentStock = productData.metadata?.stock ?? 0;
if (currentStock < requestedItem.quantity) {
  throw new Error(`Stock insuficiente para ${productData.name.es}. Disponible: ${currentStock}, Solicitado: ${requestedItem.quantity}`);
}
```

#### 3.4.2 Al Crear Pedido (Público)

❌ **NO hay validación de stock** al crear pedido desde checkout público

**Archivo:** `apps/web/src/app/api/orders/route.ts` (POST)

- El endpoint público `POST /api/orders` crea pedidos sin verificar stock
- Los pedidos se crean con `status: "pending"`
- El stock se decrementa **solo al finalizar** (acción de admin)

**Consecuencia:**
- Un cliente puede crear un pedido de productos sin stock
- El pedido queda en "pending" hasta que admin lo finalice
- Si admin intenta finalizar sin stock, falla con error

#### 3.4.3 Al Crear Pedido (Admin)

⚠️ **Validación Parcial**

**Archivo:** `apps/web/src/app/admin/orders/create/page.tsx`

```typescript
// Detecta warnings de stock bajo
const hasStockWarnings = cartItems.some((item) => {
  if (item.type !== "product") return false;
  const product = products.find((p) => p.id === item.id);
  if (!product) return false;
  const stock = product.metadata?.stock ?? 0;
  const minStock = product.metadata?.minStock ?? 0;
  return stock <= minStock;
});

// Muestra confirmación si hay warnings
if (hasStockWarnings) {
  const proceed = window.confirm("Algunos productos están por encima del stock. ¿Deseas continuar?");
  if (!proceed) return;
}
```

**Características:**
- ⚠️ Solo **advierte** si stock <= minStock, no bloquea
- ⚠️ No valida si hay suficiente stock para la cantidad pedida
- ⚠️ El pedido se crea igualmente, el stock se valida solo al finalizar

---

## 4. SISTEMA DE GESTIÓN DE INSUMOS

### 4.1 Ubicación del Stock

**Campo:** `stock` en documento `catalog_supplies/{supplyId}`

**Acceso en Código:**
```typescript
const stockValue = typeof supply.stock === "number" ? supply.stock : 0;
```

### 4.2 Visualización en Admin

**Archivo:** `apps/web/src/app/admin/supplies/page.tsx`

**Características:**
- Tabla completa de insumos con filtros y búsqueda
- Alertas visuales (rojo) si `stock <= minStock`
- Contador de insumos con stock bajo en header
- Edición inline de `unitPrice` y `minStock`
- Botón "Registrar compra" para incrementar stock

### 4.3 Actualización de Stock

#### 4.3.1 Incremento (Registrar Compra)

**Archivo:** `apps/web/src/app/admin/supplies/page.tsx` - `handleStockIncrement`

**Flujo:**
1. Admin hace clic en botón "+" junto al stock
2. Ingresa cantidad a agregar
3. Se ejecuta transacción:
   ```typescript
   await runTransaction(db, async (transaction) => {
     const supplyRef = doc(db, "catalog_supplies", stockAdjusting.id);
     const snapshot = await transaction.get(supplyRef);
     const data = snapshot.data() as Supply;
     const currentStock = typeof data.stock === "number" ? data.stock : 0;
     const nextStock = currentStock + added;
     
     // Actualizar stock
     transaction.update(supplyRef, {
       stock: nextStock,
       updatedAt: serverTimestamp(),
     });
     
     // Crear log
     const logRef = doc(collection(db, "supply_logs"));
     transaction.set(logRef, {
       supplyId: stockAdjusting.id,
       delta: added,
       previousStock: currentStock,
       newStock: nextStock,
       actorEmail: user?.email ?? null,
       createdAt: serverTimestamp(),
     });
   });
   ```

**Características:**
- ✅ Usa transacciones (atómico)
- ✅ Crea log en `supply_logs`
- ✅ Registra actor (email del usuario)
- ✅ Solo incrementa (no hay decremento automático)

#### 4.3.2 Edición Manual (Modal)

**Archivo:** `apps/web/src/app/admin/supplies/page.tsx` - `handleSaveEdit`

**Flujo:**
- Admin abre modal de edición
- Puede modificar `stock`, `minStock`, `unitPrice`, etc.
- Se guarda con `updateDoc()` (sin transacción)
- ⚠️ **NO crea log** en `supply_logs`

**Código:**
```typescript
await updateDoc(doc(db, "catalog_supplies", editingSupply.id), {
  stock: nextStock,
  minStock: nextMinStock,
  unitPrice: nextUnitPrice,
  // ... otros campos
  updatedAt: serverTimestamp(),
});
```

#### 4.3.3 Creación de Insumo

**Archivo:** `apps/web/src/app/admin/supplies/page.tsx` - `handleCreateSupply`

**Flujo:**
- Admin crea nuevo insumo desde modal
- Stock inicial se establece desde formulario
- Se guarda con `setDoc()` (sin transacción)
- ⚠️ **NO crea log** inicial

### 4.4 Alertas de Stock Bajo

**Archivo:** `apps/web/src/app/admin/supplies/page.tsx`

**Cálculo:**
```typescript
const lowStockCount = useMemo(() => {
  return supplies.filter((supply) => {
    const stock = typeof supply.stock === "number" ? supply.stock : 0;
    const minStock = typeof supply.minStock === "number" ? supply.minStock : 0;
    return stock <= minStock;
  }).length;
}, [supplies]);
```

**Visualización:**
- Badge rojo en header: "X con stock bajo"
- Fila de tabla con fondo rojo si `stock <= minStock`
- Badge "Reabastecer" en nombre del insumo

### 4.5 Dashboard Metrics

**Archivo:** `apps/web/src/app/api/admin/dashboard/summary/route.ts`

```typescript
const lowStockCount = supplies.filter((supply: any) => {
  const stock = typeof supply?.stock === "number" ? supply.stock : 0;
  const minStock = typeof supply?.minStock === "number" ? supply.minStock : 0;
  return stock <= minStock;
}).length;
```

**Uso:**
- Se muestra en dashboard admin (`/admin`)
- Contador de "Insumos críticos"

---

## 5. RELACIÓN PRODUCTOS-INSUMOS (BILL OF MATERIALS)

### 5.1 Estructura de Datos

**Ubicación:** `metadata.billOfMaterials` en `Product` y `Box`

```typescript
metadata?: {
  billOfMaterials?: Array<{
    supplyId: string;      // ID del insumo en catalog_supplies
    name: string;          // Nombre del insumo (snapshot)
    quantity: number;      // Cantidad de insumos necesarios
  }>;
};
```

### 5.2 Gestión en Admin

#### 5.2.1 Productos

**Archivo:** `apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx`

**Flujo:**
1. Admin edita producto
2. Pestaña "Insumos" muestra lista de `billOfMaterials`
3. Puede agregar insumos desde dropdown (carga `catalog_supplies`)
4. Puede eliminar insumos de la lista
5. Al guardar, se persiste en `metadata.billOfMaterials`

**Código:**
```typescript
// Cargar insumos disponibles
useEffect(() => {
  const loadSupplies = async () => {
    const db = getFirestore(getFirebaseApp());
    const snapshot = await getDocs(collection(db, "catalog_supplies"));
    const supplies = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setAvailableSupplies(supplies);
  };
  loadSupplies();
}, []);

// Guardar billOfMaterials
billOfMaterials: formState.suppliesRecipe.map((item) => ({
  supplyId: item.supplyId,
  name: item.name,
  quantity: item.quantity,
}))
```

#### 5.2.2 Cajas (Boxes)

**Archivo:** `apps/web/src/modules/admin/catalog/components/box-edit-drawer.tsx`

**Mismo flujo que productos:**
- Pestaña "Insumos" en modal de edición
- Gestión de `metadata.billOfMaterials`

### 5.3 Uso Actual

⚠️ **NO hay automatización** que decremente stock de insumos cuando se finaliza un pedido

**Estado:**
- `billOfMaterials` se almacena pero **no se usa** en flujos automáticos
- No hay cálculo de insumos necesarios al crear/finalizar pedidos
- No hay validación de stock de insumos antes de finalizar pedidos

**Oportunidad:**
- Implementar decremento automático de insumos al finalizar pedidos
- Validar stock de insumos antes de permitir finalización

---

## 6. FLUJOS DE ACTUALIZACIÓN DE STOCK

### 6.1 Diagrama de Flujos

#### Flujo 1: Crear Pedido Público → Finalizar → Decrementar Stock

```
Cliente (Checkout)
  ↓
POST /api/orders
  ↓
Crear orden (status: "pending")
  ↓ (NO decrementa stock)
Orden en Firestore
  ↓
Admin finaliza pedido
  ↓
POST /api/admin/orders/[id]/finalize
  ↓
Transacción:
  1. Validar stock disponible
  2. Decrementar metadata.stock
  3. Actualizar orden a "confirmed"
  ↓
Stock actualizado
```

#### Flujo 2: Crear Pedido Admin → Finalizar → Decrementar Stock

```
Admin (/admin/orders/create)
  ↓
POST /api/admin/orders
  ↓
Crear orden (status: "pending")
  ↓ (NO decrementa stock, solo advierte si stock <= minStock)
Orden en Firestore
  ↓
Admin finaliza pedido
  ↓
POST /api/admin/orders/[id]/finalize
  ↓
Mismo flujo que Flujo 1
```

#### Flujo 3: Eliminar Pedido → Restaurar Stock (Opcional)

```
Admin elimina pedido
  ↓
DELETE /api/admin/orders/[id]?restoreStock=true
  ↓
Transacción:
  1. Leer items del pedido
  2. Incrementar metadata.stock por cada item
  3. Eliminar orden
  ↓
Stock restaurado
```

#### Flujo 4: Registrar Compra de Insumo

```
Admin (/admin/supplies)
  ↓
Clic en "+" junto al stock
  ↓
Ingresar cantidad
  ↓
handleStockIncrement()
  ↓
Transacción:
  1. Leer stock actual
  2. Calcular nuevo stock
  3. Actualizar stock
  4. Crear log en supply_logs
  ↓
Stock y log actualizados
```

### 6.2 Operaciones Atómicas

**Productos:**
- ✅ Finalizar pedido: Usa transacción
- ✅ Eliminar pedido (restore): Usa transacción
- ❌ Edición manual: NO usa transacción

**Insumos:**
- ✅ Registrar compra: Usa transacción + log
- ❌ Edición manual: NO usa transacción, NO crea log

---

## 7. VALIDACIONES Y RESTRICCIONES

### 7.1 Validaciones Implementadas

| Validación | Productos | Insumos | Ubicación |
|------------|-----------|---------|-----------|
| Stock disponible al finalizar | ✅ | N/A | `finalize/route.ts` |
| Stock >= cantidad pedida | ✅ | N/A | `finalize/route.ts` |
| Stock bajo (alerta visual) | ✅ | ✅ | UI components |
| Stock bajo (dashboard) | ✅ | ✅ | `dashboard/summary` |
| Validar cantidad > 0 | ✅ | ✅ | Formularios |

### 7.2 Validaciones Faltantes

| Validación | Impacto | Prioridad |
|------------|---------|-----------|
| Validar stock al crear pedido público | Alto | 🔴 Alta |
| Validar stock al crear pedido admin | Medio | 🟡 Media |
| Validar stock de insumos antes de finalizar | Medio | 🟡 Media |
| Validar minStock >= 0 | Bajo | 🟢 Baja |
| Validar stock >= 0 en edición manual | Medio | 🟡 Media |
| Prevenir edición concurrente | Medio | 🟡 Media |

### 7.3 Restricciones de Negocio

**Productos:**
- ⚠️ No hay límite máximo de stock
- ⚠️ No hay validación de stock negativo
- ⚠️ No hay bloqueo de productos sin stock en catálogo público

**Insumos:**
- ⚠️ No hay límite máximo de stock
- ⚠️ No hay validación de stock negativo
- ⚠️ No hay decremento automático al usar insumos

---

## 8. LOGS Y AUDITORÍA

### 8.1 Logs de Insumos

**Colección:** `supply_logs`

**Estructura:**
```typescript
{
  supplyId: string;
  delta: number;              // Cantidad agregada (siempre positivo)
  previousStock: number;
  newStock: number;
  actorEmail: string | null;
  createdAt: Timestamp;
}
```

**Cuándo se crea:**
- ✅ Al registrar compra (incremento)
- ❌ NO se crea al editar stock manualmente
- ❌ NO se crea al crear insumo nuevo

**Limitaciones:**
- Solo registra incrementos
- No registra decrementos (no hay flujo de decremento)
- No registra cambios de otros campos (minStock, unitPrice)

### 8.2 Logs de Productos

❌ **NO hay logs** de cambios de stock de productos

**Limitaciones:**
- No se registra quién cambió el stock
- No se registra cuándo se cambió
- No se registra el valor anterior
- No hay historial de cambios

### 8.3 Auditoría de Pedidos

**Información disponible:**
- `orders.createdAt`: Fecha de creación
- `orders.updatedAt`: Fecha de última actualización
- `orders.items`: Snapshot de productos al momento de creación
- `orders.status`: Estado actual

**Limitaciones:**
- No hay historial de cambios de estado
- No hay registro de quién finalizó el pedido
- No hay registro de cuándo se decrementó el stock

---

## 9. INTERFAZ DE USUARIO (ADMIN)

### 9.1 Gestión de Productos

**Ruta:** `/admin/products`

**Funcionalidades:**
- Listado de productos con grid
- Badge de stock (rojo si bajo)
- Edición mediante drawer modal
- Pestaña "Insumos" para gestionar `billOfMaterials`
- Campo `metadata.stock` y `metadata.minStock` en formulario

**Limitaciones:**
- No hay filtro por stock bajo
- No hay búsqueda por stock
- No hay vista de solo productos sin stock

### 9.2 Gestión de Insumos

**Ruta:** `/admin/supplies`

**Funcionalidades:**
- Tabla completa con filtros y búsqueda
- Alertas visuales de stock bajo
- Edición inline de `unitPrice` y `minStock`
- Botón "Registrar compra" para incrementar stock
- Modal de edición completa
- Contador de insumos con stock bajo

**Características destacadas:**
- ✅ Filtros por categoría
- ✅ Búsqueda por nombre, ID o proveedor
- ✅ Indicador visual de retornables
- ✅ Contador de alertas en header

### 9.3 Dashboard

**Ruta:** `/admin`

**Métricas relacionadas:**
- `lowStockCount`: Insumos con stock <= minStock
- `criticalSupplies`: Mismo cálculo (duplicado)

**Limitaciones:**
- No muestra productos con stock bajo
- No muestra tendencias de stock
- No muestra historial de cambios

---

## 10. PUNTOS CRÍTICOS Y OPORTUNIDADES DE MEJORA

### 10.1 Inconsistencias de Datos

#### 🔴 CRÍTICO: Schema vs Tipo TypeScript (Insumos)

**Problema:**
- Schema API (`schemas.ts`) usa `minStockAlert` (opcional)
- Tipo TypeScript (`types.ts`) usa `minStock` (requerido)
- Schema marca `stock` como opcional, tipo lo requiere

**Impacto:**
- Validación inconsistente entre API y frontend
- Posibles errores en runtime

**Recomendación:**
- Estandarizar nombres: usar `minStock` en ambos
- Hacer `stock` requerido en schema

#### 🟡 MEDIO: Ubicación de Stock (Productos vs Insumos)

**Problema:**
- Productos: `metadata.stock` (anidado)
- Insumos: `stock` (raíz)

**Impacto:**
- Código inconsistente para acceder al stock
- Confusión al desarrollar nuevas features

**Recomendación:**
- Considerar mover stock de productos a raíz (breaking change)
- O crear helper functions para acceso consistente

### 10.2 Validaciones Faltantes

#### 🔴 CRÍTICO: No Validar Stock al Crear Pedido Público

**Problema:**
- Cliente puede crear pedido de productos sin stock
- Pedido queda en "pending" hasta que admin lo finalice
- Si admin intenta finalizar sin stock, falla

**Impacto:**
- Mala experiencia de usuario
- Pedidos que no se pueden cumplir
- Trabajo manual para cancelar pedidos

**Recomendación:**
- Validar stock disponible antes de crear pedido
- Mostrar error claro si no hay stock
- Opcionalmente: mostrar stock disponible en catálogo público

#### 🟡 MEDIO: No Validar Stock al Crear Pedido Admin

**Problema:**
- Admin puede crear pedido sin verificar stock
- Solo advierte si stock <= minStock, no valida cantidad

**Recomendación:**
- Validar stock disponible antes de crear pedido
- Bloquear creación si no hay suficiente stock (o permitir con confirmación)

### 10.3 Logs y Auditoría

#### 🟡 MEDIO: No Hay Logs de Cambios de Stock de Productos

**Problema:**
- No se registra quién cambió el stock
- No se registra cuándo se cambió
- No hay historial de cambios

**Recomendación:**
- Crear colección `product_stock_logs` similar a `supply_logs`
- Registrar todos los cambios (incrementos, decrementos, ediciones manuales)
- Incluir actor, timestamp, valor anterior, valor nuevo, razón

#### 🟡 MEDIO: Logs de Insumos Incompletos

**Problema:**
- Solo registra incrementos (registrar compra)
- No registra ediciones manuales
- No registra creación de insumos

**Recomendación:**
- Registrar todos los cambios de stock
- Incluir tipo de cambio (compra, edición manual, ajuste)

### 10.4 Automatización

#### 🟡 MEDIO: Bill of Materials No Se Usa

**Problema:**
- `billOfMaterials` se almacena pero no se usa
- No se decrementa stock de insumos al finalizar pedidos
- No se valida stock de insumos antes de finalizar

**Recomendación:**
- Implementar cálculo de insumos necesarios al finalizar pedido
- Decrementar stock de insumos automáticamente
- Validar stock de insumos antes de permitir finalización

#### 🟢 BAJO: No Hay Alertas Automáticas

**Problema:**
- Alertas visuales solo en UI
- No hay notificaciones por email/SMS
- No hay reportes automáticos

**Recomendación:**
- Implementar notificaciones cuando stock <= minStock
- Enviar reportes semanales de stock bajo
- Opcionalmente: integración con sistema de alertas

### 10.5 Mejoras de UX

#### 🟡 MEDIO: Falta Filtro de Stock Bajo en Productos

**Recomendación:**
- Agregar filtro "Stock bajo" en `/admin/products`
- Vista dedicada de productos críticos

#### 🟢 BAJO: No Hay Vista de Historial de Stock

**Recomendación:**
- Crear página `/admin/inventory/history`
- Mostrar historial de cambios de stock (productos e insumos)
- Filtros por fecha, producto/insumo, usuario

### 10.6 Estandarización

#### 🟡 MEDIO: Nombres de Campos Inconsistentes

**Problema:**
- Productos: `metadata.stock`, `metadata.minStock`
- Insumos: `stock`, `minStock`
- Schema API: `minStockAlert` vs `minStock`

**Recomendación:**
- Estandarizar nombres de campos
- Documentar convenciones
- Crear tipos compartidos entre frontend y backend

#### 🟡 MEDIO: Validaciones Duplicadas

**Problema:**
- Lógica de validación de stock bajo duplicada en varios archivos
- Cálculo de `lowStockCount` duplicado

**Recomendación:**
- Crear funciones helper compartidas
- Centralizar lógica de validación
- Reutilizar en frontend y backend

### 10.7 Performance

#### 🟢 BAJO: Queries Sin Índices

**Problema:**
- Búsqueda de productos/insumos con stock bajo hace scan completo
- No hay índices compuestos en Firestore

**Recomendación:**
- Crear índices compuestos para queries comunes
- Ejemplo: `(category, stock)` para filtrar por categoría y stock bajo

---

## 11. RESUMEN DE RECOMENDACIONES PRIORIZADAS

### 🔴 ALTA PRIORIDAD

1. **Validar stock al crear pedido público**
   - Impacto: Alto
   - Esfuerzo: Medio
   - Archivo: `apps/web/src/app/api/orders/route.ts`

2. **Estandarizar schema de insumos**
   - Impacto: Alto
   - Esfuerzo: Bajo
   - Archivos: `apps/api/src/modules/catalog/schemas.ts`, `apps/web/src/modules/supplies/types.ts`

3. **Implementar logs de stock de productos**
   - Impacto: Medio-Alto
   - Esfuerzo: Medio
   - Nueva colección: `product_stock_logs`

### 🟡 MEDIA PRIORIDAD

4. **Validar stock al crear pedido admin**
   - Impacto: Medio
   - Esfuerzo: Bajo
   - Archivo: `apps/web/src/app/api/admin/orders/route.ts`

5. **Implementar decremento automático de insumos**
   - Impacto: Medio
   - Esfuerzo: Alto
   - Archivo: `apps/web/src/app/api/admin/orders/[id]/finalize/route.ts`

6. **Completar logs de insumos**
   - Impacto: Medio
   - Esfuerzo: Bajo
   - Archivo: `apps/web/src/app/admin/supplies/page.tsx`

7. **Estandarizar ubicación de stock**
   - Impacto: Medio
   - Esfuerzo: Alto (breaking change)
   - Considerar helper functions como alternativa

### 🟢 BAJA PRIORIDAD

8. **Agregar filtros de stock bajo en productos**
   - Impacto: Bajo
   - Esfuerzo: Bajo

9. **Crear vista de historial de stock**
   - Impacto: Bajo
   - Esfuerzo: Medio

10. **Implementar notificaciones automáticas**
    - Impacto: Bajo
    - Esfuerzo: Alto

---

## 12. DIAGRAMA DE ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  catalog_products/{id}                                      │
│  ├─ metadata.stock (number)                                │
│  └─ metadata.minStock (number)                            │
│                                                             │
│  catalog_supplies/{id}                                      │
│  ├─ stock (number)                                         │
│  └─ minStock (number)                                       │
│                                                             │
│  supply_logs/{id}                                           │
│  ├─ supplyId (string)                                      │
│  ├─ delta (number)                                         │
│  ├─ previousStock (number)                                 │
│  ├─ newStock (number)                                      │
│  ├─ actorEmail (string)                                    │
│  └─ createdAt (timestamp)                                  │
│                                                             │
│  orders/{id}                                                │
│  ├─ items[] (snapshot)                                      │
│  ├─ status ("pending" | "confirmed" | ...)                  │
│  └─ ...                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/orders                                           │
│  └─ Crear pedido (NO valida stock)                         │
│                                                             │
│  POST /api/admin/orders                                     │
│  └─ Crear pedido admin (advierte stock bajo)               │
│                                                             │
│  POST /api/admin/orders/[id]/finalize                      │
│  └─ Finalizar pedido (valida y decrementa stock)           │
│                                                             │
│  DELETE /api/admin/orders/[id]?restoreStock=true           │
│  └─ Eliminar pedido (restaura stock opcional)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /admin/products                                            │
│  └─ Visualizar stock, editar metadata.stock                │
│                                                             │
│  /admin/supplies                                             │
│  ├─ Visualizar stock, alertas                               │
│  ├─ Registrar compra (incrementa + log)                    │
│  └─ Editar stock manualmente (sin log)                     │
│                                                             │
│  /admin/orders/[id]                                         │
│  └─ Finalizar pedido (decrementa stock productos)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. CONCLUSIÓN

El sistema de inventario e insumos de GreenDolio está **funcional pero tiene áreas de mejora significativas**. Las principales fortalezas son:

- ✅ Uso de transacciones para operaciones críticas
- ✅ Validación de stock al finalizar pedidos
- ✅ Sistema de logs para insumos (parcial)
- ✅ Alertas visuales de stock bajo

Las principales debilidades son:

- ❌ Falta validación de stock al crear pedidos
- ❌ Inconsistencias en schemas y tipos
- ❌ Logs incompletos (solo insumos, solo incrementos)
- ❌ Bill of Materials no se usa automáticamente

**Recomendación general:** Priorizar las mejoras de alta prioridad (validación de stock y estandarización) antes de implementar features nuevas. Esto mejorará la confiabilidad del sistema y reducirá errores en producción.

---

**Fin del Reporte**
