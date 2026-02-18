# INFORME DETALLADO: LISTA DE MERCADO
## Sistema Admin - GreenDolio

**Fecha:** 2026-02-07  
**Objetivo:** Documentación completa del diseño y funcionamiento del sistema de "Lista de Compras - Mercado" en el panel de administración.

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Componente ShoppingChecklist (Integrado)](#3-componente-shoppingchecklist-integrado)
4. [Componente MarketShoppingList (Página Dedicada)](#4-componente-marketshoppinglist-página-dedicada)
5. [API de Generación de Lista](#5-api-de-generación-de-lista)
6. [Persistencia en Firebase](#6-persistencia-en-firebase)
7. [Diseño Visual y UX](#7-diseño-visual-y-ux)
8. [Flujos de Usuario](#8-flujos-de-usuario)
9. [Análisis de Funcionalidades](#9-análisis-de-funcionalidades)
10. [Puntos de Mejora Identificados](#10-puntos-de-mejora-identificados)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual

El sistema de **Lista de Compras - Mercado** en GreenDolio consiste en **dos implementaciones diferentes**:

1. **`ShoppingChecklist`** - Componente integrado en la página de detalle de pedido (`/admin/orders/[id]`)
2. **`MarketShoppingList`** - Componente usado en página dedicada (`/admin/orders/[id]/shopping`)

### 1.2 Características Principales

| Característica | ShoppingChecklist | MarketShoppingList |
|----------------|-------------------|---------------------|
| **Ubicación** | Integrado en detalle de pedido | Página dedicada |
| **Checkboxes** | ✅ Sí | ✅ Sí |
| **Costo por producto** | ✅ Sí (campo numérico) | ✅ Sí (cantidad + precio) |
| **Cálculo de ganancia** | ✅ Sí | ✅ Sí |
| **Persistencia Firebase** | ✅ Sí (auto-guardado) | ✅ Sí (botón guardar) |
| **Desagregación de boxes** | ❌ No | ✅ Sí (vía API) |
| **Agrupación por categoría** | ❌ No | ✅ Sí |
| **Impresión** | ✅ Sí | ✅ Sí |

### 1.3 Tecnologías Utilizadas

- **Frontend:** React 19, Next.js 16.1.4
- **Base de Datos:** Firebase Firestore
- **Estilos:** Tailwind CSS + clases personalizadas
- **Iconos:** Lucide React

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Estructura de Archivos

```
apps/web/src/app/admin/orders/[id]/
├── page.tsx                          # Página principal de detalle
├── shopping-checklist.tsx            # Componente integrado (versión simple)
├── market-shopping-list.tsx         # Componente avanzado (página dedicada)
└── shopping/
    └── page.tsx                      # Página dedicada de lista de mercado

apps/web/src/app/api/admin/orders/[id]/
└── shopping-list/
    └── route.ts                      # API que genera lista desagregada
```

### 2.2 Colecciones Firebase

**Subcolección:** `orders/{orderId}/market_costs/summary`

**Estructura:**
```typescript
{
  items: {
    [productId: string]: {
      checked?: boolean;
      cost?: number | null;              // ShoppingChecklist
      actual_quantity?: number;         // MarketShoppingList
      actual_price?: number;            // MarketShoppingList
      replaced_with?: string | null;     // MarketShoppingList
    }
  };
  updatedAt: Timestamp;
}
```

**Características:**
- Subcolección dentro de cada pedido
- Documento único con ID `"summary"`
- Guarda estado de checkboxes y costos por producto
- Timestamp de última actualización

---

## 3. COMPONENTE SHOPPINGCHECKLIST (INTEGRADO)

### 3.1 Ubicación y Propósito

**Archivo:** `apps/web/src/app/admin/orders/[id]/shopping-checklist.tsx`

**Integración:** Se muestra en la columna derecha de `/admin/orders/[id]`, antes del "Control de Estado"

**Props:**
```typescript
interface ShoppingChecklistProps {
  items: OrderItem[];        // Items del pedido (directos, sin desagregar)
  orderId: string;
  orderTotal: number;        // Total del pedido
  orderCurrency?: string;   // Moneda (default: "DOP")
}
```

### 3.2 Diseño Visual

#### 3.2.1 Contenedor Principal

**Clases CSS:**
- `glass-panel` - Efecto de vidrio esmerilado (backdrop blur)
- `rounded-3xl` - Bordes muy redondeados
- `p-6` - Padding interno
- `border border-white/60` - Borde sutil blanco

**Estructura:**
```
┌─────────────────────────────────────────┐
│ Header (Título + Botón Imprimir)        │
│ Barra de Progreso                        │
│ Cards de Métricas (3 columnas)           │
│ Lista de Items (checkboxes + costos)     │
│ Mensaje "Lista completa" (si aplica)    │
└─────────────────────────────────────────┘
```

#### 3.2.2 Header

**Elementos:**
- **Título:** "Lista de Compras - Mercado" (text-lg, font-semibold, color forest)
- **Contador:** "{X} de {Y} productos marcados" (text-sm, color muted)
- **Estado de guardado:** "Guardando..." / "Guardado" / "Error al guardar" (text-xs)
- **Botón Imprimir:** Icono Printer + texto "Imprimir" (botón blanco con borde)

**Diseño:**
- Flex wrap para responsive
- Gap entre elementos
- Botón alineado a la derecha

#### 3.2.3 Barra de Progreso

**Características:**
- Altura: `h-2` (8px)
- Fondo: `bg-gray-200` (gris claro)
- Barra de progreso: `bg-emerald-500` (verde esmeralda)
- Ancho dinámico: `width: ${progress}%`
- Transición suave: `transition-all duration-300`

**Cálculo:**
```typescript
const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
```

#### 3.2.4 Cards de Métricas

**Grid:** `grid-cols-1 sm:grid-cols-3` (responsive)

**Card 1: Costo Mercado**
- Label: "COSTO MERCADO" (uppercase, tracking-wide, gray-400)
- Valor: `marketCostTotal` formateado como moneda
- Estilo: `rounded-2xl border border-gray-200 bg-white/70`

**Card 2: Precio Venta**
- Label: "PRECIO VENTA" (uppercase, tracking-wide, gray-400)
- Valor: `orderTotal` formateado como moneda
- Estilo: `rounded-2xl border border-gray-200 bg-white/70`

**Card 3: Ganancia / Pérdida**
- Label: "GANANCIA / PÉRDIDA" (uppercase, tracking-wide, gray-500)
- Valor: `profit` formateado como moneda
- **Colores dinámicos:**
  - Ganancia positiva: `text-emerald-700`, `border-emerald-200 bg-emerald-50`
  - Pérdida: `text-red-600`, `border-red-200 bg-red-50`
  - Neutro: `text-slate-600`, `border-slate-200 bg-slate-50`

#### 3.2.5 Lista de Items

**Estructura por Item:**
```
┌─────────────────────────────────────────────┐
│ [Checkbox] Nombre del Producto    ×Qty Costo│
│              (Tipo opcional)                 │
└─────────────────────────────────────────────┘
```

**Estados Visuales:**

**No marcado:**
- Fondo: `bg-white/50`
- Borde: `border-gray-200`
- Checkbox: `Square` icon (gray-400)
- Texto: `text-gray-900` (normal)

**Marcado:**
- Fondo: `bg-emerald-50`
- Borde: `border-emerald-200`
- Checkbox: `Check` icon (emerald-600)
- Texto: `line-through text-gray-500` (tachado)

**Elementos:**
1. **Checkbox interactivo:** Botón que togglea estado
2. **Nombre del producto:** `font-medium`
3. **Tipo (opcional):** `text-xs text-gray-500` debajo del nombre
4. **Cantidad:** `×{quantity}` (text-xs, gray-500)
5. **Input de costo:** Campo numérico (w-28, decimal, step 0.01)

**Input de Costo:**
- Tipo: `number`
- InputMode: `decimal`
- Placeholder: "Costo"
- Estilo: `rounded-lg border border-gray-200 bg-white/80`
- Focus: `focus:border-emerald-400`
- Alineación: `text-right`

#### 3.2.6 Mensaje "Lista Completa"

**Condición:** `checkedCount === items.length && items.length > 0`

**Diseño:**
- Contenedor: `bg-emerald-50 border border-emerald-200`
- Texto: "✓ Lista completa - Listo para preparar el pedido"
- Estilo: `text-sm font-medium text-emerald-700 text-center`

### 3.3 Funcionalidad

#### 3.3.1 Carga de Datos

**Hook:** `useEffect` (líneas 56-94)

**Flujo:**
1. Al montar componente, carga datos desde Firebase
2. Ruta: `orders/{orderId}/market_costs/summary`
3. Si existe documento, restaura estado de checkboxes y costos
4. Marca `hasLoadedRef.current = true` al terminar

**Código:**
```typescript
const docRef = doc(db, "orders", orderId, "market_costs", MARKET_COSTS_DOC_ID);
const snapshot = await getDoc(docRef);
if (snapshot.exists()) {
  const data = snapshot.data() as MarketCostsDoc;
  // Restaura estado de cada item
}
```

#### 3.3.2 Inicialización de Items

**Hook:** `useEffect` (líneas 96-109)

**Funcionalidad:**
- Cuando cambian los `items`, inicializa estado para nuevos items
- Si un item no tiene estado, crea `{ checked: false, price: "" }`
- Preserva estado de items existentes

#### 3.3.3 Guardado Automático

**Hook:** `useEffect` (líneas 111-149)

**Características:**
- **Debounce:** Espera 600ms después del último cambio antes de guardar
- **Estados:** `idle` → `saving` → `saved` / `error`
- **Solo guarda si:** `hasLoadedRef.current === true` (evita guardar antes de cargar)

**Payload guardado:**
```typescript
{
  items: {
    [itemId]: {
      checked: boolean,
      cost: number | null
    }
  },
  updatedAt: serverTimestamp()
}
```

**Manejo de errores:**
- Captura errores en try/catch
- Muestra estado "Error al guardar"
- No bloquea la UI

#### 3.3.4 Toggle de Checkbox

**Función:** `toggleItem(itemId: string)` (líneas 151-162)

**Funcionalidad:**
- Invierte estado `checked` del item
- Preserva `price` existente
- Actualiza estado local inmediatamente
- Trigger guardado automático (después de 600ms)

#### 3.3.5 Cambio de Precio

**Función:** `handlePriceChange(itemId: string, value: string)` (líneas 164-175)

**Funcionalidad:**
- Actualiza campo `price` del item
- Preserva estado `checked`
- Valida formato: acepta números con coma o punto decimal
- Trigger guardado automático (después de 600ms)

**Parsing:**
```typescript
const parseCost = (value: string) => {
  const normalized = value.replace(",", ".");  // Convierte coma a punto
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
```

#### 3.3.6 Cálculo de Totales

**Costo Total del Mercado:**
```typescript
const marketCostTotal = useMemo(() => {
  return items.reduce((sum, item) => {
    const state = itemState[item.id];
    const cost = state ? parseCost(state.price) : null;
    return sum + (cost ?? 0);
  }, 0);
}, [items, itemState, parseCost]);
```

**Ganancia/Pérdida:**
```typescript
const profit = orderTotal - marketCostTotal;
```

**Clases dinámicas según ganancia:**
- `profit > 0`: Verde (ganancia)
- `profit < 0`: Rojo (pérdida)
- `profit === 0`: Gris (neutro)

#### 3.3.7 Impresión

**Función:** `handlePrint()` (líneas 208-210)

**Funcionalidad:**
- Llama `window.print()` nativo del navegador
- Estilos CSS ocultan botones e inputs al imprimir:
  ```css
  @media print {
    button, input {
      display: none !important;
    }
  }
  ```

**Resultado:**
- Solo muestra lista de productos con checkboxes visuales
- Oculta controles interactivos
- Mantiene diseño visual

### 3.4 Integración en Página de Detalle

**Archivo:** `apps/web/src/app/admin/orders/[id]/page.tsx`

**Ubicación:** Columna derecha, primer elemento (líneas 603-613)

**Mapeo de datos:**
```typescript
<ShoppingChecklist 
  items={editedOrder.items.map(item => ({
    id: item.id,
    name: typeof item.name === 'string' ? item.name : item.name.es,
    quantity: item.quantity,
    type: item.type
  }))} 
  orderId={orderId}
  orderTotal={editedOrder.totals?.total?.amount ?? calculations.total}
  orderCurrency={editedOrder.totals?.total?.currency ?? "DOP"}
/>
```

**Características:**
- Usa items directos del pedido (sin desagregar boxes)
- Obtiene total del pedido (con fallback a cálculo local)
- Obtiene moneda del pedido (default: "DOP")

---

## 4. COMPONENTE MARKETShoppingList (PÁGINA DEDICADA)

### 4.1 Ubicación y Propósito

**Archivo:** `apps/web/src/app/admin/orders/[id]/market-shopping-list.tsx`

**Página:** `/admin/orders/[id]/shopping` (`shopping/page.tsx`)

**Props:**
```typescript
interface MarketShoppingListProps {
  orderId: string;
  orderTotal: number;
}
```

**Diferencias clave vs ShoppingChecklist:**
- ✅ Desagrega boxes en productos individuales
- ✅ Agrupa items por categoría
- ✅ Muestra precio estimado vs precio real
- ✅ Permite editar cantidad real (no solo costo)
- ✅ Campo "reemplazado por" (replaced_with)

### 4.2 Diseño Visual

#### 4.2.1 Header

**Elementos:**
- **Icono:** `ShoppingCart` (w-6 h-6, emerald-600)
- **Título:** "Lista de Compras" (text-lg, font-semibold, gray-900)
- **Contador:** "{X} de {Y} comprados" (text-sm, gray-500)
- **Botón Guardar:** "Guardar Costos" con icono Save (emerald-600, botón verde)

**Diseño:**
- Flex justify-between
- Botón verde con estado disabled cuando está guardando

#### 4.2.2 Cards de Métricas (4 columnas)

**Grid:** `grid-cols-1 md:grid-cols-4`

**Card 1: Costo Estimado**
- Label: "COSTO ESTIMADO"
- Valor: `estimatedCost` (suma de estimated_price × quantity)
- Estilo: `bg-white rounded-xl border border-gray-200`

**Card 2: Costo Real**
- Label: "COSTO REAL"
- Valor: `actualCost` (suma de actual_price × actual_quantity)
- Color: `text-blue-600` (azul)

**Card 3: Precio Venta**
- Label: "PRECIO VENTA"
- Valor: `orderTotal`
- Estilo: Estándar

**Card 4: Ganancia / Pérdida**
- Label: "GANANCIA" o "PÉRDIDA"
- Valor: `profit` (absoluto)
- **Colores dinámicos:**
  - Ganancia: `border-green-500`, `text-green-600`, icono `TrendingUp`
  - Pérdida: `border-red-500`, `text-red-600`, icono `TrendingDown`

#### 4.2.3 Lista Agrupada por Categoría

**Estructura:**
```
┌─────────────────────────────────────────────┐
│ CATEGORÍA                                    │
├─────────────────────────────────────────────┤
│ [✓] Producto 1    Qty Est Real Total        │
│ [ ] Producto 2    Qty Est Real Total        │
└─────────────────────────────────────────────┘
```

**Header de Categoría:**
- Texto: Nombre de categoría (uppercase, tracking-wide)
- Estilo: `text-sm font-semibold text-gray-700`

**Item Row:**

**Grid:** `grid-cols-12` (12 columnas)

**Columna 1 (col-span-1):** Checkbox
- Botón con icono Check o Square
- Centrado

**Columna 2-5 (col-span-4):** Nombre y unidad
- Nombre: `font-medium`, tachado si está marcado
- Unidad: `text-xs text-gray-500` (opcional)

**Columna 6-7 (col-span-2):** Cantidad real
- Label: "Cantidad"
- Input: `type="number"`, `step="0.1"` (permite decimales)
- Valor: `actual_quantity` (default: `quantity`)

**Columna 8-9 (col-span-2):** Precio estimado
- Label: "Est."
- Valor: `estimated_price` (solo lectura)
- Estilo: `text-sm font-medium text-gray-600`

**Columna 10-11 (col-span-2):** Precio real
- Label: "Real"
- Input: `type="number"`, `step="1"` (solo enteros)
- Valor: `actual_price` (default: `estimated_price`)
- Estilo: `font-semibold`

**Columna 12 (col-span-1):** Total
- Label: "Total"
- Valor: `actual_quantity × actual_price`
- Estilo: `text-sm font-bold text-emerald-600`
- Alineación: `text-right`

**Estados Visuales:**

**No marcado:**
- Fondo: `bg-white`
- Borde: `border-gray-200`

**Marcado:**
- Fondo: `bg-emerald-50`
- Borde: `border-emerald-300`

### 4.3 Funcionalidad

#### 4.3.1 Carga de Datos

**Hook:** `useEffect` (líneas 48-100)

**Flujo:**
1. Llama API `/api/admin/orders/{orderId}/shopping-list`
2. API desagrega boxes y genera lista de productos
3. Carga datos guardados desde Firebase (`market_costs/summary`)
4. Merge de datos: API como base, Firebase sobrescribe valores guardados

**Datos de API:**
```typescript
{
  id: string;
  name: string;
  estimated_price: number;
  quantity: number;
  unit?: string;
  category?: string;
}
```

**Datos de Firebase:**
```typescript
{
  actual_quantity?: number;
  actual_price?: number;
  checked?: boolean;
  replaced_with?: string | null;
}
```

#### 4.3.2 Guardado Manual

**Función:** `saveCosts()` (líneas 159-189)

**Características:**
- Botón "Guardar Costos" con estado disabled
- Guarda todos los items con sus valores actuales
- Muestra "Guardando..." durante el proceso
- Manejo de errores con console.error

**Payload:**
```typescript
{
  items: {
    [itemId]: {
      actual_quantity: number,
      actual_price: number,
      checked: boolean,
      replaced_with: string | null
    }
  },
  updatedAt: serverTimestamp()
}
```

#### 4.3.3 Toggle Checkbox

**Función:** `toggleCheck(id: string)` (líneas 137-141)

**Funcionalidad:**
- Invierte estado `checked` del item
- Actualiza estado local
- No guarda automáticamente (requiere botón "Guardar")

#### 4.3.4 Actualizar Cantidad Real

**Función:** `updateQuantity(id: string, value: number)` (líneas 143-149)

**Funcionalidad:**
- Actualiza `actual_quantity` del item
- Valida mínimo: `Math.max(0, value)`
- Permite decimales (step 0.1)
- No guarda automáticamente

#### 4.3.5 Actualizar Precio Real

**Función:** `updatePrice(id: string, value: number)` (líneas 151-157)

**Funcionalidad:**
- Actualiza `actual_price` del item
- Valida mínimo: `Math.max(0, value)`
- Solo enteros (step 1)
- No guarda automáticamente

#### 4.3.6 Cálculos

**Costo Estimado:**
```typescript
const estimatedCost = items.reduce(
  (sum, item) => sum + item.quantity * item.estimated_price,
  0
);
```

**Costo Real:**
```typescript
const actualCost = items.reduce(
  (sum, item) => sum + (item.actual_quantity || 0) * (item.actual_price || 0),
  0
);
```

**Ganancia/Pérdida:**
```typescript
const profit = orderTotal - actualCost;
```

### 4.4 Página Dedicada

**Archivo:** `apps/web/src/app/admin/orders/[id]/shopping/page.tsx`

**Ruta:** `/admin/orders/[id]/shopping`

**Características:**
- Header sticky con botón "Volver" y "Imprimir"
- Información del pedido (ID, cliente, fecha)
- Contenedor principal con `MarketShoppingList`
- Estilos de impresión optimizados

**Header (no imprimir):**
- Botón volver con icono ArrowLeft
- Título y subtítulo con info del pedido
- Botón imprimir destacado (bg-gray-900)

**Header (solo imprimir):**
- Título grande
- Información del pedido formateada
- Separador horizontal

---

## 5. API DE GENERACIÓN DE LISTA

### 5.1 Endpoint

**Ruta:** `GET /api/admin/orders/[id]/shopping-list`

**Archivo:** `apps/web/src/app/api/admin/orders/[id]/shopping-list/route.ts`

**Autenticación:** Requiere sesión admin (`requireAdminSession`)

### 5.2 Funcionalidad

#### 5.2.1 Proceso de Desagregación

**Paso 1: Leer Pedido**
- Lee documento `orders/{orderId}`
- Extrae array `items`

**Paso 2: Procesar Items**

**Para Items tipo "box":**
1. Identifica boxId desde `productId`, `metadata.productId`, `referenceId`, o `id`
2. Lee documento `catalog_boxes/{boxId}`
3. Identifica variante del box (mix, fruity, veggie)
4. Lee `referenceContents` de la variante
5. Para cada producto en `referenceContents`:
   - Multiplica cantidad por cantidad del box pedido
   - Agrega a mapa agregado

**Para Items tipo "product":**
1. Identifica productId
2. Agrega cantidad directamente al mapa agregado

**Paso 3: Enriquecer con Datos de Productos**
1. Lee documentos `catalog_products` para todos los productIds
2. Lee documentos `catalog_categories` para categorías
3. Para cada producto agregado:
   - Obtiene nombre (localizado)
   - Obtiene precio estimado (`salePrice` o `price`)
   - Obtiene unidad (localizada)
   - Obtiene categoría (localizada)

**Paso 4: Ordenar y Formatear**
1. Ordena por categoría (alfabético)
2. Dentro de categoría, ordena por nombre (alfabético)
3. Retorna array de `ShoppingListItem`

### 5.3 Estructura de Respuesta

```typescript
{
  data: [
    {
      id: string;              // ID del producto
      name: string;            // Nombre localizado (es)
      estimated_price: number; // Precio estimado (salePrice o price)
      quantity: number;        // Cantidad total (suma de todas las ocurrencias)
      unit?: string;           // Unidad (ej: "kg", "und")
      category?: string;       // Categoría localizada
    }
  ]
}
```

### 5.4 Funciones Helper

**`normalizeVariantKey(value)`**
- Normaliza clave de variante a "mix", "fruity", "veggie"
- Maneja variaciones de escritura

**`resolveLocalizedString(value)`**
- Extrae string de objeto `{ es, en }`
- Prioriza `es`, fallback a `en`

**`resolveUnit(value)`**
- Similar a `resolveLocalizedString` pero para unidades

**`pickVariant(variants, variantKey)`**
- Selecciona variante del box según clave
- Fallback a variante "mix" o primera disponible

**`toNumber(value, fallback)`**
- Convierte a número con fallback

---

## 6. PERSISTENCIA EN FIREBASE

### 6.1 Estructura de Datos

**Ruta:** `orders/{orderId}/market_costs/summary`

**Documento:**
```typescript
{
  items: {
    [productId: string]: {
      // ShoppingChecklist
      checked?: boolean;
      cost?: number | null;
      
      // MarketShoppingList
      actual_quantity?: number;
      actual_price?: number;
      replaced_with?: string | null;
    }
  };
  updatedAt: Timestamp;
}
```

### 6.2 ShoppingChecklist

**Guardado:**
- **Automático** con debounce de 600ms
- **Merge:** `{ merge: true }` para no sobrescribir otros campos
- **Solo guarda:** `checked` y `cost`

**Carga:**
- Al montar componente
- Restaura estado de checkboxes y costos
- Marca `hasLoadedRef.current = true` antes de permitir guardado

### 6.3 MarketShoppingList

**Guardado:**
- **Manual** mediante botón "Guardar Costos"
- **Merge:** `{ merge: true }`
- **Guarda:** `actual_quantity`, `actual_price`, `checked`, `replaced_with`

**Carga:**
- Después de cargar datos de API
- Merge con datos guardados (Firebase sobrescribe valores por defecto)

### 6.4 Consideraciones

**⚠️ INCONSISTENCIA:**
- `ShoppingChecklist` guarda `cost` (número)
- `MarketShoppingList` guarda `actual_price` (número)
- Ambos usan la misma estructura pero campos diferentes
- Pueden sobrescribirse mutuamente si se usan ambos

**Recomendación:**
- Estandarizar nombres de campos
- O usar componentes separados para casos de uso diferentes

---

## 7. DISEÑO VISUAL Y UX

### 7.1 Sistema de Colores

**Paleta Principal:**
- **Verde (Éxito/Completado):** `emerald-500`, `emerald-600`, `emerald-50`, `emerald-200`
- **Rojo (Pérdida/Error):** `red-600`, `red-200`, `red-50`
- **Gris (Neutro):** `gray-200`, `gray-400`, `gray-500`, `gray-600`, `gray-900`
- **Azul (Costo Real):** `blue-600` (solo en MarketShoppingList)

**Colores de Marca:**
- **Forest:** `var(--gd-color-forest)` (títulos)
- **Text Muted:** `var(--gd-color-text-muted)` (subtítulos)

### 7.2 Tipografía

**Jerarquía:**
- **Títulos:** `text-lg font-semibold` (18px)
- **Subtítulos:** `text-sm` (14px)
- **Labels:** `text-xs uppercase tracking-wide` (12px, mayúsculas)
- **Valores:** `text-lg font-semibold` o `text-2xl font-bold` (métricas)

**Fuentes:**
- Sistema: Tailwind default (sans-serif)
- No usa fuentes personalizadas (Railey, Montserrat)

### 7.3 Espaciado y Layout

**Contenedor Principal:**
- Padding: `p-6` (24px)
- Border radius: `rounded-3xl` (24px)
- Gap entre secciones: `mb-4`, `mb-6` (16px, 24px)

**Grids:**
- Métricas: `grid-cols-1 sm:grid-cols-3` (responsive)
- Items: `space-y-2` (8px entre items)

**Cards:**
- Padding: `p-4` (16px)
- Border radius: `rounded-2xl` (16px)
- Border: `border border-gray-200`

### 7.4 Estados Interactivos

**Hover:**
- Botones: `hover:bg-white/80`, `hover:bg-emerald-700`
- Inputs: `focus:border-emerald-400`

**Transiciones:**
- Barra de progreso: `transition-all duration-300`
- Items: `transition` (bordes y fondos)

**Estados Disabled:**
- Botón guardar: `disabled:opacity-50`

### 7.5 Responsive Design

**Breakpoints:**
- `sm:` (640px) - Grid de métricas cambia a 3 columnas
- `md:` (768px) - Grid de métricas cambia a 4 columnas (MarketShoppingList)

**Adaptaciones:**
- Header con `flex-wrap` para móviles
- Grids colapsan a 1 columna en móviles
- Inputs mantienen tamaño fijo (w-28)

### 7.6 Accesibilidad

**Elementos Interactivos:**
- Botones tienen `type="button"` explícito
- Inputs tienen `type="number"` y `inputMode="decimal"`
- Labels asociados con inputs (implícito por estructura)

**Contraste:**
- Texto sobre fondo claro: Cumple WCAG AA
- Estados de error visibles (rojo)

**Mejoras Sugeridas:**
- Agregar `aria-label` a checkboxes
- Agregar `aria-live` para estado de guardado
- Mejorar navegación por teclado

---

## 8. FLUJOS DE USUARIO

### 8.1 Flujo: ShoppingChecklist (Integrado)

```
Admin abre detalle de pedido
  ↓
Componente ShoppingChecklist se monta
  ↓
Carga datos desde Firebase (market_costs/summary)
  ↓
Muestra lista de items del pedido
  ↓
Admin marca checkbox de producto comprado
  ↓
Estado se actualiza localmente (inmediato)
  ↓
Espera 600ms sin cambios
  ↓
Guarda automáticamente en Firebase
  ↓
Muestra "Guardado" brevemente
  ↓
Admin ingresa costo del producto
  ↓
Estado se actualiza localmente (inmediato)
  ↓
Espera 600ms sin cambios
  ↓
Guarda automáticamente en Firebase
  ↓
Cálculo de ganancia se actualiza automáticamente
```

### 8.2 Flujo: MarketShoppingList (Página Dedicada)

```
Admin navega a /admin/orders/[id]/shopping
  ↓
Página carga pedido desde API
  ↓
Componente MarketShoppingList se monta
  ↓
Llama API /shopping-list (desagrega boxes)
  ↓
Carga datos guardados desde Firebase
  ↓
Merge de datos (Firebase sobrescribe valores por defecto)
  ↓
Muestra lista agrupada por categoría
  ↓
Admin marca productos comprados
  ↓
Admin ajusta cantidades reales
  ↓
Admin ajusta precios reales
  ↓
Admin hace clic en "Guardar Costos"
  ↓
Muestra "Guardando..."
  ↓
Guarda en Firebase
  ↓
Muestra botón normalizado
```

### 8.3 Flujo: Impresión

```
Admin hace clic en "Imprimir"
  ↓
Navegador abre diálogo de impresión
  ↓
CSS oculta botones e inputs (@media print)
  ↓
Muestra solo:
  - Título y información del pedido
  - Lista de productos con checkboxes visuales
  - Métricas (costo, ganancia)
  ↓
Admin imprime o guarda como PDF
```

---

## 9. ANÁLISIS DE FUNCIONALIDADES

### 9.1 Funcionalidades Implementadas

| Funcionalidad | ShoppingChecklist | MarketShoppingList |
|---------------|-------------------|---------------------|
| **Checkboxes interactivos** | ✅ | ✅ |
| **Persistencia de estado** | ✅ | ✅ |
| **Cálculo de costos** | ✅ | ✅ |
| **Cálculo de ganancia** | ✅ | ✅ |
| **Guardado automático** | ✅ | ❌ |
| **Guardado manual** | ❌ | ✅ |
| **Desagregación de boxes** | ❌ | ✅ |
| **Agrupación por categoría** | ❌ | ✅ |
| **Edición de cantidad** | ❌ | ✅ |
| **Precio estimado vs real** | ❌ | ✅ |
| **Campo "reemplazado por"** | ❌ | ✅ |
| **Impresión optimizada** | ✅ | ✅ |
| **Barra de progreso** | ✅ | ❌ |
| **Mensaje "lista completa"** | ✅ | ❌ |

### 9.2 Comparación de Casos de Uso

**ShoppingChecklist (Integrado):**
- ✅ **Ventaja:** Acceso rápido desde detalle de pedido
- ✅ **Ventaja:** Guardado automático (menos clicks)
- ✅ **Ventaja:** Barra de progreso visual
- ❌ **Limitación:** No desagrega boxes
- ❌ **Limitación:** Solo muestra items directos del pedido

**MarketShoppingList (Página Dedicada):**
- ✅ **Ventaja:** Desagrega boxes en productos individuales
- ✅ **Ventaja:** Agrupación por categoría (mejor organización)
- ✅ **Ventaja:** Permite ajustar cantidades reales
- ✅ **Ventaja:** Muestra precio estimado vs real
- ❌ **Limitación:** Requiere navegar a página separada
- ❌ **Limitación:** Guardado manual (más clicks)

### 9.3 Análisis de Datos

**ShoppingChecklist:**
- Usa items directos del pedido
- No transforma datos
- Simple y rápido

**MarketShoppingList:**
- Transforma pedido en lista de compras
- Desagrega boxes complejos
- Enriquece con datos de productos y categorías
- Más procesamiento, más información

---

## 10. PUNTOS DE MEJORA IDENTIFICADOS

### 10.1 🔴 CRÍTICO: Inconsistencia en Campos Firebase

**Problema:**
- `ShoppingChecklist` guarda `cost`
- `MarketShoppingList` guarda `actual_price`
- Ambos usan la misma estructura pero campos diferentes

**Impacto:**
- Datos pueden perderse si se usan ambos componentes
- Confusión sobre qué campo usar

**Recomendación:**
- Estandarizar a `cost` o `actual_price`
- O usar subcolecciones separadas

### 10.2 🟡 MEDIO: Falta Sincronización entre Componentes

**Problema:**
- Cambios en `ShoppingChecklist` no se reflejan en `MarketShoppingList`
- Cada componente carga datos independientemente

**Recomendación:**
- Usar listeners de Firestore en tiempo real
- O unificar en un solo componente

### 10.3 🟡 MEDIO: ShoppingChecklist No Desagrega Boxes

**Problema:**
- Muestra boxes como items individuales
- No muestra productos dentro de boxes

**Recomendación:**
- Integrar lógica de desagregación de API
- O mostrar tooltip con contenido del box

### 10.4 🟢 BAJO: Falta Validación de Datos

**Problema:**
- No valida que costos sean números válidos
- No valida que cantidades sean positivas
- No previene valores negativos

**Recomendación:**
- Agregar validación en inputs
- Mostrar mensajes de error claros

### 10.5 🟢 BAJO: Mejoras de UX

**Sugerencias:**
- Agregar animaciones al marcar items
- Agregar sonido/feedback al completar lista
- Agregar filtros (solo pendientes, solo comprados)
- Agregar búsqueda de productos
- Agregar ordenamiento (por nombre, por costo, por categoría)

---

## 11. DIAGRAMA DE ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  orders/{orderId}                                           │
│  ├─ items[] (snapshot del pedido)                          │
│  └─ market_costs/                                           │
│     └─ summary/                                             │
│        ├─ items: {                                          │
│        │   [productId]: {                                   │
│        │     checked: boolean,                              │
│        │     cost: number,                                  │
│        │     actual_quantity: number,                       │
│        │     actual_price: number,                          │
│        │     replaced_with: string                          │
│        │   }                                                │
│        │ }                                                  │
│        └─ updatedAt: Timestamp                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET /api/admin/orders/[id]/shopping-list                  │
│  └─ Desagrega boxes en productos                            │
│  └─ Enriquece con datos de catalog_products                 │
│  └─ Agrupa por categoría                                    │
│  └─ Retorna lista ordenada                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /admin/orders/[id]                                         │
│  └─ ShoppingChecklist (integrado)                          │
│     ├─ Items directos del pedido                           │
│     ├─ Checkboxes + costos                                  │
│     ├─ Guardado automático (600ms debounce)                 │
│     └─ Cálculo de ganancia                                  │
│                                                             │
│  /admin/orders/[id]/shopping                                │
│  └─ MarketShoppingList (página dedicada)                    │
│     ├─ Lista desagregada (vía API)                          │
│     ├─ Agrupada por categoría                               │
│     ├─ Cantidad + precio estimado vs real                   │
│     ├─ Guardado manual (botón)                              │
│     └─ Cálculo de ganancia                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. CONCLUSIÓN

El sistema de **Lista de Compras - Mercado** en GreenDolio ofrece **dos implementaciones complementarias**:

### Fortalezas

- ✅ **ShoppingChecklist:** Acceso rápido, guardado automático, integrado en flujo de trabajo
- ✅ **MarketShoppingList:** Desagregación inteligente de boxes, organización por categoría, control detallado
- ✅ **Persistencia:** Ambos guardan en Firebase
- ✅ **Cálculos:** Ambos calculan ganancia/pérdida automáticamente
- ✅ **Impresión:** Ambos soportan impresión optimizada

### Áreas de Mejora

- ⚠️ **Inconsistencia:** Campos diferentes en Firebase (`cost` vs `actual_price`)
- ⚠️ **Duplicación:** Dos componentes con funcionalidad similar
- ⚠️ **Sincronización:** No hay sincronización en tiempo real entre componentes

### Recomendación General

**Corto plazo:** Estandarizar campos en Firebase para evitar pérdida de datos.

**Mediano plazo:** Considerar unificar componentes o crear sistema de sincronización.

**Largo plazo:** Evaluar si se necesitan ambos componentes o consolidar en uno solo con modo "simple" y "avanzado".

---

**Fin del Informe**
