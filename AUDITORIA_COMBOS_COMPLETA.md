# 🔍 AUDITORÍA COMPLETA - SISTEMA DE COMBOS
## GreenDolio - Análisis Exhaustivo del Ecosistema de Combos

**Fecha:** 2026-02-09  
**Objetivo:** Auditoría completa del sistema de combos y su integración con productos/órdenes  
**Metodología:** Análisis de código, tipos, APIs, UI, integraciones y datos en vivo

---

## TABLA DE CONTENIDOS

1. [PART 1: COMBOS DATA STRUCTURE](#part-1-combos-data-structure)
2. [PART 2: COMBOS APIs](#part-2-combos-apis)
3. [PART 3: COMBOS UI & COMPONENTS](#part-3-combos-ui--components)
4. [PART 4: COMBOS IN ORDERS](#part-4-combos-in-orders)
5. [PART 5: COMBOS IN SHOPPING/INVENTORY](#part-5-combos-in-shoppinginventory)
6. [PART 6: CURRENT PROBLEMS & GAPS](#part-6-current-problems--gaps)
7. [PART 7: COMBOS VS PRODUCTS COMPARISON](#part-7-combos-vs-products-comparison)
8. [PART 8: LIVE DATA VERIFICATION](#part-8-live-data-verification)

---

## PART 1: COMBOS DATA STRUCTURE

### STEP 1: Firestore Combo Structure

#### 1.1 Complete Structure of `lunch_combos` Collection

**Colección:** `lunch_combos`  
**Ubicación en código:** `apps/web/src/app/api/admin/catalog/combos/route.ts` (línea 6)

**Estructura en Firestore:**
```typescript
{
  id: string;                    // ID del documento (generado automáticamente)
  name: { es: string, en: string };
  price: number;
  nutrition: {
    calories: number;
    protein: number;
    isGlutenFree: boolean;
  };
  benefits: { es: string, en: string };
  image?: string;
  isFeatured: boolean;
  status: "active" | "inactive" | "coming_soon";
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

**Campos guardados en Firestore (POST/PUT):**
- `name` (LocalizedString)
- `price` (number)
- `nutrition.calories` (number)
- `nutrition.protein` (number)
- `nutrition.isGlutenFree` (boolean)
- `benefits` (LocalizedString)
- `image` (string, opcional)
- `isFeatured` (boolean)
- `status` (string: "active" | "inactive" | "coming_soon")
- `createdAt` (ISO string)
- `updatedAt` (ISO string)

**⚠️ IMPORTANTE:** Los siguientes campos NO se guardan en Firestore, solo se usan en la respuesta de la API:
- `salad`, `juice`, `dessert` (LocalizedString)
- `cost`, `margin` (number)
- `benefitDetail`, `recommendedFor` (LocalizedString)
- `carbs`, `fats`, `fiber`, `sugars` (number)
- `vitaminA`, `vitaminC` (string)
- `ingredients` (LocalizedString[])

#### 1.2 All Fields with Types and Examples

| Campo | Tipo Firestore | Tipo API Response | Ejemplo | Notas |
|-------|----------------|-------------------|---------|-------|
| `id` | `string` | `string` | `"abc123"` | Auto-generado |
| `name` | `{es: string, en: string}` | `LocalizedString` | `{es: "Detox Verde", en: "Green Detox"}` | ✅ Guardado |
| `price` | `number` | `number` | `500` | ✅ Guardado |
| `nutrition.calories` | `number` | `number` | `420` | ✅ Guardado |
| `nutrition.protein` | `number` | `number` | `12` | ✅ Guardado |
| `nutrition.isGlutenFree` | `boolean` | `boolean` | `false` | ✅ Guardado |
| `benefits` | `{es: string, en: string}` | `LocalizedString` | `{es: "Depuración", en: "Detox"}` | ✅ Guardado |
| `image` | `string?` | `string?` | `"/assets/images/combos/GD-COMB-001.png"` | ✅ Guardado |
| `isFeatured` | `boolean` | `boolean` | `true` | ✅ Guardado |
| `status` | `string` | `"active" \| "inactive" \| "coming_soon"` | `"active"` | ✅ Guardado |
| `createdAt` | `string` | `string` | `"2026-02-09T10:00:00.000Z"` | ✅ Guardado |
| `updatedAt` | `string` | `string` | `"2026-02-09T10:00:00.000Z"` | ✅ Guardado |
| `salad` | ❌ NO guardado | `LocalizedString` | `{es: "Verde Detox", en: "Green Detox"}` | ⚠️ Solo en respuesta |
| `juice` | ❌ NO guardado | `LocalizedString` | `{es: "Pepinada", en: "Cucumber"}` | ⚠️ Solo en respuesta |
| `dessert` | ❌ NO guardado | `LocalizedString` | `{es: "Melón", en: "Melon"}` | ⚠️ Solo en respuesta |
| `cost` | ❌ NO guardado | `number?` | `187` | ⚠️ Solo en respuesta |
| `margin` | ❌ NO guardado | `number?` | `63` | ⚠️ Solo en respuesta |
| `benefitDetail` | ❌ NO guardado | `LocalizedString` | `{es: "...", en: "..."}` | ⚠️ Solo en respuesta |
| `recommendedFor` | ❌ NO guardado | `LocalizedString` | `{es: "...", en: "..."}` | ⚠️ Solo en respuesta |
| `carbs` | ❌ NO guardado | `number` | `62` | ⚠️ Solo en respuesta (default: 0) |
| `fats` | ❌ NO guardado | `number` | `14` | ⚠️ Solo en respuesta (default: 0) |
| `fiber` | ❌ NO guardado | `number` | `11` | ⚠️ Solo en respuesta (default: 0) |
| `sugars` | ❌ NO guardado | `number` | `18` | ⚠️ Solo en respuesta (default: 0) |
| `vitaminA` | ❌ NO guardado | `string` | `"Alto"` | ⚠️ Solo en respuesta (default: "") |
| `vitaminC` | ❌ NO guardado | `string` | `"Muy Alto"` | ⚠️ Solo en respuesta (default: "") |
| `ingredients` | ❌ NO guardado | `LocalizedString[]` | `[{es: "...", en: "..."}]` | ⚠️ Solo en respuesta (default: []) |

#### 1.3 Sample Combo Document (JSON)

**Ejemplo de documento en Firestore:**
```json
{
  "id": "abc123def456",
  "name": {
    "es": "Detox Verde",
    "en": "Green Detox"
  },
  "price": 500,
  "nutrition": {
    "calories": 420,
    "protein": 12,
    "isGlutenFree": false
  },
  "benefits": {
    "es": "Depuración y alcalinización",
    "en": "Detox & Alkalinization"
  },
  "image": "/assets/images/combos/GD-COMB-001.png",
  "isFeatured": true,
  "status": "active",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-02-09T14:20:00.000Z"
}
```

**Ejemplo de respuesta de API GET:**
```json
{
  "id": "abc123def456",
  "name": {
    "es": "Detox Verde",
    "en": "Green Detox"
  },
  "salad": { "es": "", "en": "" },
  "juice": { "es": "", "en": "" },
  "dessert": { "es": "", "en": "" },
  "price": 500,
  "cost": undefined,
  "margin": undefined,
  "calories": 420,
  "protein": 12,
  "glutenFree": false,
  "benefit": {
    "es": "Depuración y alcalinización",
    "en": "Detox & Alkalinization"
  },
  "benefitDetail": { "es": "", "en": "" },
  "recommendedFor": { "es": "", "en": "" },
  "carbs": 0,
  "fats": 0,
  "fiber": 0,
  "sugars": 0,
  "vitaminA": "",
  "vitaminC": "",
  "image": "/assets/images/combos/GD-COMB-001.png",
  "ingredients": [],
  "status": "active",
  "isFeatured": true
}
```

#### 1.4 How Many Combos Exist in Live DB?

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Método de verificación sugerido:**
1. Ejecutar query en Firebase Console: `lunch_combos` collection
2. O usar código: `db.collection("lunch_combos").get().then(snap => snap.size)`

**Código de referencia:** `apps/web/src/app/api/admin/catalog/combos/route.ts` línea 12

#### 1.5 Any Subcollections Under Combos?

**❌ NO hay subcolecciones bajo `lunch_combos`**

Los combos son documentos simples sin subcolecciones.

---

### STEP 2: Combos Type Definitions

#### 2.1 All TypeScript Types for Combos

**Tipo 1: `Combo` (Completo)**
- **Archivo:** `apps/web/src/modules/catalog/types.ts`
- **Líneas:** 146-171
- **Uso:** Tipo principal usado en admin y APIs

```typescript
export type Combo = {
  id: string;
  name: LocalizedString;
  salad: LocalizedString;
  juice: LocalizedString;
  dessert: LocalizedString;
  price: number;
  cost?: number;
  margin?: number;
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString;
  benefitDetail: LocalizedString;
  recommendedFor: LocalizedString;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA?: string;
  vitaminC?: string;
  image?: string;
  ingredients: LocalizedString[];
  status: "active" | "inactive" | "coming_soon";
  isFeatured: boolean;
};
```

**Tipo 2: `LunchCombo` (Simplificado)**
- **Archivo:** `apps/web/src/modules/catalog/types.ts`
- **Líneas:** 173-184
- **Uso:** Usado por `fetchLunchCombos()` pero **NO se usa** en frontend público

```typescript
export type LunchCombo = {
  id: string;
  name: LocalizedString;
  price: number;
  nutrition: {
    calories: number;
    protein: number;
    isGlutenFree: boolean;
  };
  benefits: LocalizedString;
  image?: string;
};
```

**Tipo 3: `Combo` (Hardcodeado en Frontend)**
- **Archivo:** `apps/web/src/app/_components/lunch-combos-section.tsx`
- **Líneas:** 14-38
- **Uso:** Solo para datos hardcodeados en el componente

```typescript
type Combo = {
  id: number;                    // ⚠️ NUMBER, no string
  sku: string;
  name: LocalizedString | string;
  salad: LocalizedString | string;
  juice: LocalizedString | string;
  dessert: LocalizedString | string;
  price: number;
  cost: number;                  // ⚠️ Requerido, no opcional
  margin: number;                // ⚠️ Requerido, no opcional
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString | string;
  benefitDetail: LocalizedString | string;
  recommendedFor: LocalizedString | string;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA: string;
  vitaminC: string;
  image?: string;
  ingredients: (LocalizedString | string)[];
};
```

#### 2.2 Where Are They Defined? (File Paths + Line Numbers)

| Tipo | Archivo | Líneas | Scope |
|------|---------|--------|-------|
| `Combo` | `apps/web/src/modules/catalog/types.ts` | 146-171 | Global (exportado) |
| `LunchCombo` | `apps/web/src/modules/catalog/types.ts` | 173-184 | Global (exportado) |
| `Combo` (local) | `apps/web/src/app/_components/lunch-combos-section.tsx` | 14-38 | Local al componente |

#### 2.3 Are There Multiple Combo Type Definitions?

**✅ SÍ, hay 3 definiciones diferentes:**

1. **`Combo` (types.ts)** - Tipo completo con todos los campos
2. **`LunchCombo` (types.ts)** - Tipo simplificado (5 campos)
3. **`Combo` (lunch-combos-section.tsx)** - Tipo local con `id: number`

#### 2.4 Any Conflicts or Inconsistencies?

**🔴 CONFLICTOS CRÍTICOS:**

1. **ID Type Mismatch:**
   - `Combo` (types.ts): `id: string`
   - `Combo` (lunch-combos-section.tsx): `id: number`
   - **Impacto:** Los combos hardcodeados usan números, pero Firebase usa strings

2. **Campos Opcionales vs Requeridos:**
   - `Combo` (types.ts): `cost?`, `margin?` (opcionales)
   - `Combo` (lunch-combos-section.tsx): `cost`, `margin` (requeridos)

3. **Campos No Guardados en Firestore:**
   - `salad`, `juice`, `dessert`, `cost`, `margin`, `benefitDetail`, `recommendedFor`, `carbs`, `fats`, `fiber`, `sugars`, `vitaminA`, `vitaminC`, `ingredients`
   - **Problema:** Se envían en PUT pero NO se guardan en Firestore
   - **Ubicación:** `apps/web/src/app/api/admin/catalog/combos/[id]/route.ts` líneas 17-30

4. **Tipo `ProductType` incluye "combo":**
   - **Archivo:** `apps/web/src/modules/catalog/types.ts` línea 26
   - **Definición:** `export type ProductType = "simple" | "box" | "combo" | "prepared";`
   - **Problema:** Los combos NO son productos, pero están en el tipo de productos

---

## PART 2: COMBOS APIs

### STEP 3: Combo API Endpoints

#### 3.1 List ALL APIs That Touch Combos

**Endpoint 1: GET `/api/admin/catalog/combos`**
- **Archivo:** `apps/web/src/app/api/admin/catalog/combos/route.ts`
- **Líneas:** 8-59
- **Método:** GET
- **Autenticación:** ✅ Requiere admin session

**Endpoint 2: POST `/api/admin/catalog/combos`**
- **Archivo:** `apps/web/src/app/api/admin/catalog/combos/route.ts`
- **Líneas:** 61-121
- **Método:** POST
- **Autenticación:** ✅ Requiere admin session

**Endpoint 3: PUT `/api/admin/catalog/combos/[id]`**
- **Archivo:** `apps/web/src/app/api/admin/catalog/combos/[id]/route.ts`
- **Líneas:** 8-69
- **Método:** PUT
- **Autenticación:** ✅ Requiere admin session

**Endpoint 4: GET `/api/catalog/combos` (Público)**
- **Archivo:** `apps/web/src/app/api/catalog/combos/route.ts`
- **Líneas:** 4-12
- **Método:** GET
- **Autenticación:** ❌ Público (sin autenticación)

**❌ NO existe DELETE endpoint**

#### 3.2 Complete Code for Each Endpoint

**GET `/api/admin/catalog/combos` (Líneas 8-59):**
```typescript
export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const snapshot = db.collection(COMBOS_COLLECTION).get();
    const data = snapshot.docs.map((doc) => {
      const combo = doc.data() as Record<string, any>;
      const name = combo.name ?? {};
      const benefits = combo.benefits ?? {};
      const nutrition = combo.nutrition ?? {};
      return {
        id: doc.id,
        name: { es: name.es ?? name.en ?? "", en: name.en ?? name.es ?? "" },
        salad: { es: "", en: "" },  // ⚠️ Hardcoded empty
        juice: { es: "", en: "" },   // ⚠️ Hardcoded empty
        dessert: { es: "", en: "" }, // ⚠️ Hardcoded empty
        price: Number(combo.price) || 0,
        cost: combo.cost ? Number(combo.cost) : undefined,
        margin: combo.margin ? Number(combo.margin) : undefined,
        calories: Number(nutrition.calories) || 0,
        protein: Number(nutrition.protein) || 0,
        glutenFree: Boolean(nutrition.isGlutenFree),
        benefit: { es: benefits.es ?? benefits.en ?? "", en: benefits.en ?? benefits.es ?? "" },
        benefitDetail: { es: "", en: "" },  // ⚠️ Hardcoded empty
        recommendedFor: { es: "", en: "" }, // ⚠️ Hardcoded empty
        carbs: 0,  // ⚠️ Hardcoded 0
        fats: 0,   // ⚠️ Hardcoded 0
        fiber: 0,  // ⚠️ Hardcoded 0
        sugars: 0, // ⚠️ Hardcoded 0
        vitaminA: "", // ⚠️ Hardcoded empty
        vitaminC: "", // ⚠️ Hardcoded empty
        image: combo.image ?? "",
        ingredients: [], // ⚠️ Hardcoded empty array
        status: combo.status ?? "active",
        isFeatured: combo.isFeatured ?? false,
      };
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    // Error handling...
  }
}
```

**POST `/api/admin/catalog/combos` (Líneas 61-121):**
```typescript
export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const body = await request.json();
    const payload = {
      name: body?.name ?? { es: "Nuevo combo", en: "New combo" },
      price: Number(body?.price) || 0,
      nutrition: {
        calories: Number(body?.calories) || 0,
        protein: Number(body?.protein) || 0,
        isGlutenFree: Boolean(body?.glutenFree),
      },
      benefits: body?.benefit ?? { es: "", en: "" },
      image: body?.image ?? "",
      isFeatured: body?.isFeatured ?? false,
      status: body?.status ?? "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = db.collection(COMBOS_COLLECTION).doc();
    await docRef.set(payload);
    await docRef.set({ id: docRef.id }, { merge: true });
    // Response includes fields NOT saved to Firestore...
    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    // Error handling...
  }
}
```

**PUT `/api/admin/catalog/combos/[id]` (Líneas 8-69):**
```typescript
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const body = await request.json();
    const { id } = await params;
    const comboId = decodeURIComponent(id);
    const payload = {
      name: body?.name,
      price: Number(body?.price) || 0,
      nutrition: {
        calories: Number(body?.calories) || 0,
        protein: Number(body?.protein) || 0,
        isGlutenFree: Boolean(body?.glutenFree),
      },
      benefits: body?.benefit,
      image: body?.image ?? "",
      isFeatured: body?.isFeatured ?? false,
      status: body?.status ?? "active",
      updatedAt: new Date().toISOString(),
    };
    const docRef = db.collection(COMBOS_COLLECTION).doc(comboId);
    await docRef.set(payload, { merge: true });
    // Response includes fields NOT saved to Firestore...
    return NextResponse.json({ data: responseData }, { status: 200 });
  } catch (error) {
    // Error handling...
  }
}
```

**GET `/api/catalog/combos` (Público) (Líneas 4-12):**
```typescript
export async function GET() {
  try {
    const data = await fetchLunchCombos();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### 3.3 Request/Response Shapes

**GET Request:**
- **Request:** `GET /api/admin/catalog/combos`
- **Headers:** `Cookie: session=...` (admin session)
- **Response:** `{ data: Combo[] }`

**POST Request:**
- **Request:** `POST /api/admin/catalog/combos`
- **Body:**
```json
{
  "name": { "es": "...", "en": "..." },
  "price": 500,
  "calories": 420,
  "protein": 12,
  "glutenFree": false,
  "benefit": { "es": "...", "en": "..." },
  "image": "...",
  "isFeatured": false,
  "status": "inactive"
}
```
- **Response:** `{ data: Combo }` (con campos adicionales no guardados)

**PUT Request:**
- **Request:** `PUT /api/admin/catalog/combos/[id]`
- **Body:** Similar a POST, pero puede incluir campos adicionales que NO se guardan
- **Response:** `{ data: Combo }` (con campos adicionales no guardados)

#### 3.4 What Firestore Operations?

| Endpoint | Operación Firestore | Código |
|----------|---------------------|--------|
| GET | `collection().get()` | Línea 12 |
| POST | `collection().doc().set()` | Líneas 83-84 |
| PUT | `collection().doc().set(..., { merge: true })` | Línea 33 |
| DELETE | ❌ No existe | - |

#### 3.5 What Validations?

**Validaciones implementadas:**

1. **Autenticación:** Todos los endpoints admin requieren `requireAdminSession`
2. **Tipos numéricos:** Conversión con `Number()` y fallback a 0
3. **Booleanos:** Conversión con `Boolean()`
4. **Strings:** Fallback a `""` o valores por defecto

**❌ Validaciones FALTANTES:**

1. ❌ No valida que `price >= 0`
2. ❌ No valida que `calories >= 0`
3. ❌ No valida que `protein >= 0`
4. ❌ No valida formato de `name.es` y `name.en`
5. ❌ No valida formato de URL de `image`
6. ❌ No valida que `status` sea uno de los valores permitidos

#### 3.6 Error Handling?

**Manejo de errores:**
```typescript
catch (error) {
  console.error("Error ...:", error);
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}
```

**Problemas:**
- ❌ No diferencia entre tipos de errores
- ❌ No valida datos de entrada antes de procesar
- ❌ No maneja errores de Firestore específicos

---

### STEP 4: Product Integration in Combos

#### 4.1 How Do Combos Reference Products?

**❌ LOS COMBOS NO REFERENCIAN PRODUCTOS DIRECTAMENTE**

Los combos son entidades independientes que NO tienen relación con productos del catálogo. Solo tienen:
- `salad`, `juice`, `dessert` (strings localizados, NO IDs de productos)
- `ingredients` (array de strings localizados, NO IDs de productos)

#### 4.2 Field Structure for Combo Items/Products

**No existe estructura de items/productos en combos.**

Los combos solo tienen campos descriptivos:
- `salad`: Descripción de la ensalada (string)
- `juice`: Descripción del jugo (string)
- `dessert`: Descripción del postre (string)
- `ingredients`: Lista de ingredientes (strings)

#### 4.3 Can Combos Contain Boxes?

**❌ NO, los combos NO pueden contener boxes**

No hay estructura para referenciar boxes dentro de combos.

#### 4.4 Can Combos Contain Other Combos?

**❌ NO, los combos NO pueden contener otros combos**

No hay estructura para referenciar combos dentro de combos.

#### 4.5 Stock Handling for Combo Products?

**❌ NO hay manejo de stock para combos**

Los combos NO tienen:
- Campo `stock`
- Campo `minStock`
- Lógica de decremento de stock
- Validación de disponibilidad

**Problema:** Los combos se pueden agregar a órdenes sin verificar disponibilidad de productos individuales.

---

## PART 3: COMBOS UI & COMPONENTS

### STEP 5: Combo Management UI

#### 5.1 What Components Are Used?

**Archivo:** `apps/web/src/app/admin/combos/page.tsx`

**Componentes:**
1. `AdminGuard` - Protección de ruta admin
2. `ComboManager` - Componente principal de gestión

#### 5.2 How Does It Load Combos?

**Código (líneas 17-36):**
```typescript
const loadData = useCallback(async () => {
  try {
    setStatus("loading");
    setError(null);
    const combosRes = await adminFetch("/api/admin/catalog/combos", { cache: "no-store" });
    if (!combosRes.ok) {
      throw new Error("No se pudieron cargar los combos");
    }
    const combosJson = await combosRes.json();
    setCombos(Array.isArray(combosJson.data) ? combosJson.data : []);
    setStatus("ready");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error inesperado");
    setStatus("error");
  }
}, []);
```

**Flujo:**
1. Llama `GET /api/admin/catalog/combos`
2. Parsea respuesta JSON
3. Valida que sea array
4. Actualiza estado

#### 5.3 What Actions Are Available?

**Acciones disponibles:**

1. **Crear Combo** (línea 158-198)
   - Función: `handleCreateCombo()`
   - Endpoint: `POST /api/admin/catalog/combos`
   - Crea combo con valores por defecto

2. **Editar Combo** (línea 200-279)
   - Función: `handleSubmit()`
   - Endpoint: `PUT /api/admin/catalog/combos/[id]`
   - Actualiza todos los campos del combo

3. **Buscar Combos** (línea 300-306)
   - Input de búsqueda por nombre
   - Filtra en tiempo real

4. **Seleccionar Combo** (línea 317)
   - Click en card de combo
   - Carga formulario de edición

**❌ NO existe acción de eliminar**

#### 5.4 Line Numbers for Each Action

| Acción | Función | Líneas | Endpoint |
|--------|---------|--------|----------|
| Crear | `handleCreateCombo` | 158-198 | POST `/api/admin/catalog/combos` |
| Editar | `handleSubmit` | 200-279 | PUT `/api/admin/catalog/combos/[id]` |
| Buscar | `setQuery` | 300-306 | - |
| Seleccionar | `setSelectedId` | 317 | - |

---

### STEP 6: ComboManager Component

#### 6.1 Complete Component Code

**Archivo:** `apps/web/src/modules/admin/catalog/components/combo-manager.tsx`  
**Líneas:** 1-799  
**Tamaño:** ~800 líneas

#### 6.2 Props Interface

```typescript
type ComboManagerProps = {
  initialCombos: Combo[];
};
```

#### 6.3 State Management

**Estados:**
```typescript
const [combos, setCombos] = useState<Combo[]>(initialCombos);
const [query, setQuery] = useState<string>("");
const [selectedId, setSelectedId] = useState<string | null>(null);
const [formState, setFormState] = useState<FormState | null>(null);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

**FormState (líneas 16-47):**
```typescript
type FormState = {
  nameEs: string;
  nameEn: string;
  saladEs: string;
  saladEn: string;
  juiceEs: string;
  juiceEn: string;
  dessertEs: string;
  dessertEn: string;
  price: string;
  cost: string;
  margin: string;
  calories: string;
  protein: string;
  glutenFree: boolean;
  benefitEs: string;
  benefitEn: string;
  benefitDetailEs: string;
  benefitDetailEn: string;
  recommendedForEs: string;
  recommendedForEn: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugars: string;
  vitaminA: string;
  vitaminC: string;
  image: string;
  status: Combo["status"];
  isFeatured: boolean;
  ingredients: Array<{ es: string; en: string }>;
};
```

#### 6.4 Form Fields and Validation

**Campos del formulario:**

1. **Nombres** (líneas 385-409)
   - `nameEs` (requerido)
   - `nameEn` (requerido)

2. **Contenido** (líneas 412-477)
   - `saladEs`, `saladEn` (requeridos)
   - `juiceEs`, `juiceEn` (requeridos)
   - `dessertEs`, `dessertEn` (requeridos)

3. **Costos** (líneas 479-518)
   - `price` (requerido, number)
   - `cost` (opcional, number)
   - `margin` (opcional, number)

4. **Nutrición** (líneas 520-617)
   - `calories` (requerido, number)
   - `protein` (requerido, number)
   - `carbs`, `fats`, `fiber`, `sugars` (requeridos, number)
   - `vitaminA`, `vitaminC` (opcionales, string)
   - `glutenFree` (checkbox)

5. **Beneficios** (líneas 619-684)
   - `benefitEs`, `benefitEn` (requeridos)
   - `benefitDetailEs`, `benefitDetailEn` (requeridos)
   - `recommendedForEs`, `recommendedForEn` (requeridos)

6. **Imagen** (líneas 686-718)
   - `image` (URL o path)
   - Upload field con `ImageUploadField`

7. **Ingredientes** (líneas 720-740)
   - `ingredients` (JSON array de `{es, en}`)

8. **Estado** (líneas 742-779)
   - `status` (select: active/inactive/coming_soon)
   - `isFeatured` (checkbox)
   - `glutenFree` (checkbox)

**Validaciones:**
- ✅ Campos requeridos tienen `required` attribute
- ✅ Campos numéricos tienen `type="number"`
- ❌ NO valida que números sean >= 0
- ❌ NO valida formato de URL de imagen
- ❌ NO valida formato JSON de ingredientes antes de guardar

#### 6.5 How Does It Save Combos?

**Función `handleSubmit` (líneas 200-279):**

1. Previene submit default
2. Valida que hay combo seleccionado y formState
3. Construye payload con todos los campos
4. Llama `PUT /api/admin/catalog/combos/[id]`
5. Actualiza estado local con respuesta
6. Muestra mensaje de éxito

**⚠️ PROBLEMA:** Envía campos que NO se guardan en Firestore (`salad`, `juice`, `dessert`, `cost`, `margin`, etc.)

#### 6.6 Image Upload Handling?

**Componente usado:** `ImageUploadField` (línea 8)

**Código (líneas 699-705):**
```typescript
<ImageUploadField
  label={t("admin.combo_manager.upload_image")}
  pathPrefix={`combos/${selectedCombo.id}`}
  onUploaded={(url) => setFormState((state) => ({ ...state!, image: url }))}
/>
```

**Funcionalidad:**
- Sube imagen a Firebase Storage
- Path: `combos/{comboId}/...`
- Callback actualiza `formState.image` con URL retornada

---

## PART 4: COMBOS IN ORDERS

### STEP 7: How Combos Are Added to Orders

#### 7.1 Can Combos Be Added to Orders?

**✅ SÍ, los combos se pueden agregar a órdenes**

**Evidencia:**
- `apps/web/src/app/admin/orders/create/page.tsx` línea 15: `type: "product" | "box" | "combo"`
- Línea 103-109: Normalización de combos para catálogo
- Línea 107: `type: "combo"`

#### 7.2 How Are They Stored in `order.items[]`?

**Estructura en `order.items[]`:**
```typescript
{
  id: string;
  name: string | LocalizedString;
  type: "combo";
  quantity: number;
  unitPrice: { amount: number; currency: string };
  slug: string;  // SKU del combo (ej: "GD-COMB-001")
  image?: string;
  // ... otros campos opcionales
}
```

**Código de referencia:** `apps/web/src/app/admin/orders/create/page.tsx` líneas 103-109

#### 7.3 Example Order Item for a Combo (JSON)

```json
{
  "id": "abc123",
  "name": "Detox Verde",
  "type": "combo",
  "quantity": 2,
  "unitPrice": {
    "amount": 500,
    "currency": "DOP"
  },
  "slug": "GD-COMB-001",
  "image": "/assets/images/combos/GD-COMB-001.png"
}
```

#### 7.4 How Is Pricing Calculated?

**Precio del combo:**
- Se obtiene del campo `price` del combo
- Se multiplica por `quantity`
- No hay descuentos ni ajustes especiales

**Código:** `apps/web/src/app/admin/orders/create/page.tsx` línea 106: `price: Number(item.price ?? 0)`

#### 7.5 How Is It Different from Products/Boxes?

| Aspecto | Products | Boxes | Combos |
|---------|----------|-------|--------|
| **Tipo en order** | `"product"` | `"box"` | `"combo"` |
| **Stock tracking** | ✅ Sí | ✅ Sí (indirecto) | ❌ NO |
| **Desagregación** | ❌ No | ✅ Sí (en shopping list) | ❌ NO |
| **Variantes** | ❌ No | ✅ Sí | ❌ NO |
| **Configuración** | ❌ No | ✅ Sí (likes/dislikes) | ❌ NO |
| **Precio dinámico** | ❌ No | ✅ Sí (extras) | ❌ NO |

---

### STEP 8: Order Processing with Combos

#### 8.1 Does Order Finalization Handle Combos?

**❌ NO, la finalización NO maneja combos específicamente**

**Código:** `apps/web/src/app/api/admin/orders/[id]/finalize/route.ts`

**Lógica actual:**
- Solo procesa items con `type === "product"`
- Filtra items: `items.filter(item => item.type === "product")` (línea ~70)
- **Los combos se ignoran completamente**

**Problema:** Los combos NO decrementan stock al finalizar orden.

#### 8.2 Stock Deduction Logic for Combos?

**❌ NO existe lógica de deducción de stock para combos**

Los combos NO tienen:
- Campo `stock` en Firestore
- Lógica de decremento en finalización
- Validación de disponibilidad

#### 8.3 Shopping List Expansion for Combos?

**❌ NO, los combos NO se expanden en shopping lists**

**Evidencia:**

1. **Consolidated Shopping (`/api/admin/shopping/consolidated`):**
   - Líneas 328-447: Solo procesa `type === "box"` y `type === "product"`
   - **NO hay lógica para `type === "combo"`**

2. **Individual Shopping (`/api/admin/orders/[id]/shopping-list`):**
   - Líneas 278-459: Solo procesa `type === "box"` y productos directos
   - **NO hay lógica para `type === "combo"`**

#### 8.4 Any Special Handling vs Regular Products?

**❌ NO hay manejo especial para combos**

Los combos se tratan como productos simples en:
- Carrito (línea 386: `type: "product"`)
- Órdenes (se almacenan como items normales)
- **Pero NO se procesan en finalización ni shopping lists**

---

## PART 5: COMBOS IN SHOPPING/INVENTORY

### STEP 9: Combos in Consolidated Shopping

#### 9.1 Are Combos Processed? (Search for "combo")

**❌ NO, los combos NO se procesan**

**Archivo:** `apps/web/src/app/api/admin/shopping/consolidated/route.ts`

**Búsqueda de "combo":**
- ❌ No aparece en el código
- ❌ No hay lógica para `item.type === "combo"`

**Lógica actual (líneas 328-447):**
```typescript
if (itemType === "box") {
  // Procesa boxes...
  continue;
}

if (itemType === "product" && productData?.type === "prepared") {
  // Procesa productos preparados...
  continue;
}

// Procesa productos directos...
addToAggregation(productAggregation, "product", productId, itemQuantity, {...});
```

**Los combos caen en el último caso y se tratan como productos directos, pero NO se expanden.**

#### 9.2 If Yes, How Are They Expanded?

**N/A - No se procesan**

#### 9.3 If No, Why Not?

**Razones:**

1. **Los combos NO tienen estructura de productos:**
   - No tienen campo `products` o `items`
   - Solo tienen `salad`, `juice`, `dessert` como strings descriptivos

2. **Los combos NO referencian productos del catálogo:**
   - No hay IDs de productos asociados
   - No se puede expandir a productos individuales

3. **Falta implementación:**
   - No hay lógica para desagregar combos
   - No hay mapeo de combos a productos

#### 9.4 Should They Be?

**✅ SÍ, DEBERÍAN procesarse si los combos referenciaran productos**

**Recomendación:**
- Agregar campo `products` a combos con IDs de productos
- Implementar lógica de expansión similar a boxes
- O mantener combos como items indivisibles (pero documentar esto)

---

### STEP 10: Combos in Individual Shopping

#### 10.1 Same Questions as STEP 9

**Archivo:** `apps/web/src/app/api/admin/orders/[id]/shopping-list/route.ts`

**Búsqueda de "combo":**
- ❌ No aparece en el código
- ❌ No hay lógica para `item.type === "combo"`

**Lógica actual (líneas 278-459):**
```typescript
if (item.type === "box") {
  // Procesa boxes...
  continue;
}

// Procesa productos preparados...
if (productDoc?.type === "prepared" && recipeIngredients.length) {
  // Expande recetas...
  continue;
}

// Procesa productos directos...
addProduct(canonicalProductId, itemQuantity, { source_type: "direct" }, {...});
```

**Los combos caen en el último caso y se tratan como productos directos, pero NO se expanden.**

#### 10.2 Line Numbers Where Combos Should Be Handled

**Lugares donde DEBERÍA agregarse lógica:**

1. **Línea ~282:** Después de `if (item.type === "box")`
2. **Línea ~422:** Después de `if (productDoc?.type === "prepared")`

**Código sugerido:**
```typescript
if (item.type === "combo") {
  // TODO: Expandir combo a productos individuales
  // Necesita estructura de productos en combo
  continue;
}
```

---

## PART 6: CURRENT PROBLEMS & GAPS

### STEP 11: Find Combo-Related Issues

#### 11.1 TODOs Mentioning Combos

**Búsqueda:** `grep -r "TODO.*combo\|FIXME.*combo\|XXX.*combo"`

**Resultado:** ❌ No se encontraron TODOs relacionados con combos

#### 11.2 Console Errors/Warnings About Combos

**No se pueden verificar sin ejecutar la app**

**Posibles problemas:**
- Combos hardcodeados vs Firebase pueden causar inconsistencias
- Campos no guardados pueden causar pérdida de datos

#### 11.3 Commented Code About Combos

**Búsqueda:** No se encontró código comentado específico sobre combos

#### 11.4 Incomplete Implementations

**Implementaciones incompletas identificadas:**

1. **❌ DELETE endpoint faltante**
   - No se puede eliminar combos desde admin
   - Solo se puede cambiar status a "inactive"

2. **❌ Campos no guardados en Firestore**
   - `salad`, `juice`, `dessert`, `cost`, `margin`, `benefitDetail`, `recommendedFor`, `carbs`, `fats`, `fiber`, `sugars`, `vitaminA`, `vitaminC`, `ingredients`
   - Se envían en PUT pero NO se persisten

3. **❌ Expansión de combos en shopping lists**
   - No se expanden a productos individuales
   - No se pueden usar en lista de compras consolidada

4. **❌ Stock tracking**
   - No hay manejo de stock para combos
   - No se valida disponibilidad

5. **❌ Finalización de órdenes**
   - Combos se ignoran en finalización
   - No decrementan stock de productos relacionados

---

### STEP 12: Feature Gaps

#### 12.1 Can Combos Have Images?

**✅ SÍ, los combos pueden tener imágenes**

- Campo `image` en Firestore (opcional)
- Upload mediante `ImageUploadField`
- Path: `combos/{comboId}/...`

#### 12.2 Can Combos Have Variants?

**❌ NO, los combos NO tienen variantes**

No hay estructura para variantes como en boxes.

#### 12.3 Can Combos Be Featured/Active/Inactive?

**✅ SÍ**

- Campo `isFeatured` (boolean)
- Campo `status` ("active" | "inactive" | "coming_soon")

#### 12.4 Nutrition Info Handling?

**✅ PARCIAL**

**Guardado en Firestore:**
- `nutrition.calories`
- `nutrition.protein`
- `nutrition.isGlutenFree`

**NO guardado (solo en respuesta):**
- `carbs`, `fats`, `fiber`, `sugars`
- `vitaminA`, `vitaminC`

#### 12.5 Description Multilingual?

**✅ SÍ**

- `name` (LocalizedString)
- `benefits` (LocalizedString)
- `salad`, `juice`, `dessert` (LocalizedString) - pero NO guardados
- `benefitDetail`, `recommendedFor` (LocalizedString) - pero NO guardados

#### 12.6 Category Assignment?

**❌ NO, los combos NO tienen categorías**

No hay campo `categoryId` en combos.

#### 12.7 Stock Tracking?

**❌ NO, los combos NO tienen tracking de stock**

No hay campos `stock` o `minStock`.

---

## PART 7: COMBOS VS PRODUCTS COMPARISON

### STEP 13: Side-by-Side Comparison

| Feature | Products | Combos | Notes |
|---------|----------|--------|-------|
| **Image** | ✅ | ✅ | Ambos soportan imágenes |
| **Price** | ✅ | ✅ | Ambos tienen precio |
| **Stock** | ✅ | ❌ | Combos NO tienen stock |
| **Categories** | ✅ | ❌ | Combos NO tienen categorías |
| **Variants** | ❌ | ❌ | Ninguno tiene variantes (boxes sí) |
| **In orders** | ✅ | ✅ | Ambos se pueden agregar a órdenes |
| **In shopping** | ✅ | ❌ | Combos NO se expanden en shopping lists |
| **Multilingual** | ✅ | ✅ | Ambos soportan es/en |
| **Status** | ✅ | ✅ | Ambos tienen status (active/inactive/etc) |
| **Featured** | ✅ | ✅ | Ambos pueden ser destacados |
| **Nutrition** | ✅ | ⚠️ | Combos tienen nutrición parcial |
| **SKU** | ✅ | ❌ | Combos NO tienen SKU en Firestore |
| **Type field** | ✅ | ❌ | Combos NO tienen `type` en Firestore |
| **Recipe** | ✅ | ❌ | Combos NO tienen recetas |
| **Finalization** | ✅ | ❌ | Combos NO se procesan en finalización |
| **Stock decrement** | ✅ | ❌ | Combos NO decrementan stock |
| **Admin CRUD** | ✅ | ⚠️ | Combos NO tienen DELETE |
| **Public API** | ✅ | ✅ | Ambos tienen API pública |
| **Hardcoded data** | ❌ | ✅ | Combos tienen datos hardcodeados en frontend |

**Leyenda:**
- ✅ Implementado completamente
- ⚠️ Implementado parcialmente
- ❌ No implementado

---

## PART 8: LIVE DATA VERIFICATION

### STEP 14: Check Live Firestore Data

#### 14.1 Total Combo Count

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Método sugerido:**
```typescript
const snapshot = await db.collection("lunch_combos").get();
console.log("Total combos:", snapshot.size);
```

#### 14.2 List All Combo IDs and Names

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Método sugerido:**
```typescript
const snapshot = await db.collection("lunch_combos").get();
snapshot.docs.forEach(doc => {
  console.log("ID:", doc.id, "Name:", doc.data().name);
});
```

#### 14.3 Show 2-3 Complete Combo Documents

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Estructura esperada (basada en código):**
```json
{
  "id": "doc-id-1",
  "name": { "es": "...", "en": "..." },
  "price": 500,
  "nutrition": {
    "calories": 420,
    "protein": 12,
    "isGlutenFree": false
  },
  "benefits": { "es": "...", "en": "..." },
  "image": "/assets/images/combos/GD-COMB-001.png",
  "isFeatured": true,
  "status": "active",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-02-09T14:20:00.000Z"
}
```

#### 14.4 Any Combos in Actual Orders?

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Método sugerido:**
```typescript
const ordersSnapshot = await db.collection("orders").get();
let comboCount = 0;
ordersSnapshot.docs.forEach(doc => {
  const items = doc.data().items || [];
  items.forEach(item => {
    if (item.type === "combo") comboCount++;
  });
});
console.log("Combos en órdenes:", comboCount);
```

#### 14.5 Any Orphaned References?

**⚠️ NO SE PUEDE VERIFICAR SIN ACCESO A FIRESTORE**

**Posibles problemas:**
- Combos referenciados en órdenes pero eliminados de Firestore
- SKUs hardcodeados que no existen en Firestore

---

## RESUMEN EJECUTIVO

### Problemas Críticos Identificados

1. **🔴 Campos no guardados en Firestore**
   - `salad`, `juice`, `dessert`, `cost`, `margin`, `benefitDetail`, `recommendedFor`, `carbs`, `fats`, `fiber`, `sugars`, `vitaminA`, `vitaminC`, `ingredients`
   - Se envían en PUT pero NO se persisten

2. **🔴 Combos NO se procesan en finalización**
   - Se ignoran completamente
   - NO decrementan stock

3. **🔴 Combos NO se expanden en shopping lists**
   - No aparecen en lista consolidada
   - No aparecen en lista individual

4. **🔴 Datos hardcodeados vs Firebase**
   - Frontend usa datos hardcodeados
   - Admin usa datos de Firebase
   - **NO están sincronizados**

5. **🔴 Falta DELETE endpoint**
   - No se puede eliminar combos
   - Solo se puede cambiar status

### Recomendaciones Prioritarias

1. **URGENTE:** Decidir qué campos guardar en Firestore
   - Si `salad`, `juice`, `dessert` son importantes → guardarlos
   - Si NO → removerlos de la UI

2. **URGENTE:** Implementar expansión de combos en shopping lists
   - O documentar que combos NO se expanden
   - Agregar estructura de productos a combos si se necesita expansión

3. **MEDIO:** Sincronizar datos hardcodeados con Firebase
   - Migrar datos hardcodeados a Firestore
   - O remover datos hardcodeados y usar solo Firebase

4. **MEDIO:** Agregar DELETE endpoint
   - Implementar `DELETE /api/admin/catalog/combos/[id]`
   - O documentar que solo se puede cambiar status

5. **BAJO:** Agregar validaciones
   - Validar precios >= 0
   - Validar formatos de URLs
   - Validar valores de status

---

**Fin de la Auditoría**
