# MIGRACIÓN V2 DEFINITIVA - Green Dolio

## Documento de Ingeniería de Documentación
**Versión de Seguridad Funcional - Análisis Completo**

---

## 1. MAPEO DE UI - ARCHIVOS DE LOOK MODERNO

### 1.1 Layout Principal
**Ruta:** `apps/web/src/app/layout.tsx`
- Define el layout raíz de la aplicación
- Configura fuentes: Montserrat (variable: `--font-montserrat`) y Patua One (variable: `--font-patua`)
- Incluye Providers globales (Auth, Language, Catalog, Cart, BoxBuilder)
- Metadata SEO completa con OpenGraph y Twitter Cards

### 1.2 Página Principal (Home)
**Ruta:** `apps/web/src/app/page.tsx`
- Componente servidor que carga datos iniciales (categorías, cajas, productos, reglas)
- Estructura de secciones:
  - Hero Section (cliente)
  - Sección de Cajas (#cajas)
  - Combos de Almuerzo (#combos)
  - Catálogo Unificado (#catalogo)
  - Secciones estáticas y contacto

### 1.3 Navbar (Navegación Principal)
**Ruta:** `apps/web/src/app/_components/primary-nav.tsx`
- Navbar sticky con backdrop blur
- Logo con imagen `/images/logo/logo-vertical.png`
- Enlaces de navegación: Cajas, Combos, Catálogo, Sobre Nosotros
- Botones: Carrito, Autenticación, Selector de Idioma
- Estilos: `bg-white/98 shadow-lg backdrop-blur-md border-b-2 border-[var(--gd-color-leaf)]/20`

### 1.4 Hero Section
**Rutas:**
- `apps/web/src/app/_components/hero-section.tsx` (versión servidor)
- `apps/web/src/app/_components/hero-section-client.tsx` (versión cliente con animaciones)
- `apps/web/src/app/_components/home-page-client.tsx` (wrapper que incluye LogoSplash y HeroSectionClient)

**Características:**
- Imagen de fondo: `/images/hero/hero-rainbow-abundance.jpg`
- Overlay con gradientes
- Logo principal: `/images/logo/logo-principal-large.png`
- Badge con emoji 🌱
- Títulos con jerarquía visual
- Diferenciadores: Delivery, Empaques Retornables, Productos Locales
- CTAs: "Armar Caja" y "Ver Catálogo"
- Animaciones con elementos decorativos orgánicos (blur, pulse)

### 1.5 Footer
**Ruta:** `apps/web/src/app/_components/footer.tsx`
- Fondo: `bg-[var(--gd-color-forest)]`
- Grid de 4 columnas: Logo/Tagline, Navegación, Contacto, Zonas de Entrega
- Información de contacto: teléfono, email, Instagram
- Copyright y badges de sostenibilidad

### 1.6 Componentes de Contenedor
**Ruta:** `apps/web/src/app/_components/container.tsx`
- Componente wrapper para contenido con márgenes consistentes

---

## 2. LÓGICA DE DATOS - CONEXIÓN CON FIREBASE

### 2.1 Inicialización de Firebase
**Ruta:** `apps/web/src/lib/firebase/client.ts`

**Código de Inicialización:**
```typescript
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getClientEnv } from "../config/env";

let clientApp: FirebaseApp | undefined;
let storageInstance: FirebaseStorage | undefined;
let firestoreInstance: Firestore | undefined;

function getFirebaseConfig() {
  const env = getClientEnv();
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (clientApp) return clientApp;
  if (getApps().length) {
    clientApp = getApps()[0];
  } else {
    const firebaseConfig = getFirebaseConfig();
    clientApp = initializeApp(firebaseConfig);
  }
  return clientApp;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  const isSupported = await isAnalyticsSupported();
  return isSupported ? getAnalytics(getFirebaseApp()) : null;
}

export function getFirebaseStorage() {
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

export function getFirestoreDb() {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
}
```

**Variables de Entorno Requeridas:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (opcional)

### 2.2 Servicio de Carga de Productos

**Arquitectura:**
La aplicación NO carga productos directamente desde Firebase en el cliente. En su lugar, utiliza una API intermedia que actúa como proxy.

**Ruta del Servicio de Catálogo (Cliente):**
`apps/web/src/modules/catalog/api.ts`

```typescript
import { getApiBaseUrl } from "@/lib/config/env";
import type { Box, BoxRule, Product, ProductCategory } from "./types";

const DEFAULT_REVALIDATE_SECONDS = 30;

async function fetchRemote<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    console.warn("Catalog API base URL is not configured.");
    return [] as unknown as T;
  }

  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(
      url,
      {
        cache: "force-cache",
        next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
      }
    );

    if (!response.ok) {
      console.warn(`Catalog API error for ${path}: ${response.status}`);
      return [] as unknown as T;
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.warn(`Catalog API failed for ${path}`, error);
    return [] as unknown as T;
  }
}

export async function fetchProductCategories() {
  return fetchRemote<ProductCategory[]>("/catalog/categories");
}

export async function fetchBoxes() {
  return fetchRemote<Box[]>("/catalog/boxes");
}

export async function fetchProducts() {
  return fetchRemote<Product[]>("/catalog/products");
}

export async function fetchBoxRules() {
  return fetchRemote<BoxRule[]>("/catalog/box-rules");
}
```

**Context Provider de Catálogo:**
**Ruta:** `apps/web/src/modules/catalog/context.tsx`

```typescript
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { BoxRule, Product } from "./types";
import { setBoxRulesMap, setProductMetaMap } from "@/modules/box-builder/utils";

type CatalogContextValue = {
  products: Product[];
  boxRules: BoxRule[];
  productMap: Map<string, Product>;
  isLoading: boolean;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

async function fetchCatalog<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn(`Catalog fetch failed for ${path}`, error);
    return [];
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [boxRules, setBoxRules] = useState<BoxRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      const [productsData, rulesData] = await Promise.all([
        fetchCatalog<Product>("/api/catalog/products"),
        fetchCatalog<BoxRule>("/api/catalog/box-rules"),
      ]);
      if (!isActive) return;
      setProducts(productsData);
      setBoxRules(rulesData);
      setIsLoading(false);
    }

    load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setProductMetaMap(products);
  }, [products]);

  useEffect(() => {
    setBoxRulesMap(boxRules);
  }, [boxRules]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);
  const value = useMemo(
    () => ({ products, boxRules, productMap, isLoading }),
    [products, boxRules, productMap, isLoading],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
}
```

**Flujo de Datos:**
1. El servidor (SSR) carga datos usando `fetchProductCategories()`, `fetchBoxes()`, `fetchProducts()`, `fetchBoxRules()` desde la API base
2. El cliente usa `CatalogProvider` que carga datos desde `/api/catalog/products` y `/api/catalog/box-rules`
3. Las rutas API (`/api/catalog/*`) actúan como proxy hacia la API backend que sí se conecta a Firebase

**Configuración de API Base:**
**Ruta:** `apps/web/src/lib/config/env.ts`

```typescript
export function getApiBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL;
}
```

Variable de entorno: `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:5001/api`)

---

## 3. CONFIGURACIÓN DE ESTILOS

### 3.1 Tailwind Config
**Ruta:** `apps/web/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Nota:** La configuración es mínima. Las extensiones de tema se definen principalmente mediante variables CSS en `globals.css`.

### 3.2 Globals CSS
**Ruta:** `apps/web/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --gd-color-forest: #2d5016;
  --gd-color-leaf: #7db835;
  --gd-color-sprout: #d4e5b8;
  --gd-color-avocado: #6a994e;
  --gd-color-sky: #7dd3c0;
  --gd-color-beige: #f5f1e8;
  --gd-color-apple: #e63946;
  --gd-color-strawberry: #c1121f;
  --gd-color-citrus: #f77f00;
  --gd-color-text: #1a1a1a;
  --gd-color-text-muted: #6c6c6c;
  --gd-color-border: #e5e5e5;
  --gd-color-white: #ffffff;
  --gd-surface: var(--gd-color-white);
  --gd-surface-muted: var(--gd-color-beige);
  --gd-body: var(--gd-color-text);
  --gd-font-sans: var(--font-montserrat, "Montserrat", "Helvetica Neue", Arial, sans-serif);
  --gd-font-display: var(--font-patua, "Patua One", "Cooper Black", "Georgia", serif);
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--gd-surface);
  color: var(--gd-body);
  font-family: var(--gd-font-sans);
  -webkit-font-smoothing: antialiased;
}

.font-display {
  font-family: var(--gd-font-display);
}

a {
  color: inherit;
  text-decoration: none;
}

.shadow-soft {
  box-shadow: 0 20px 45px -22px rgba(44, 82, 52, 0.35);
}

.shadow-soft-lg {
  box-shadow: 0 30px 60px -15px rgba(45, 80, 22, 0.3);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* Animaciones personalizadas */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes splash-fade {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes splash-logo {
  0% {
    opacity: 0;
    transform: scale(0.82);
  }
  45% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.02);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px) translateY(-1px) rotate(-1deg);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px) translateY(1px) rotate(1deg);
  }
}

@keyframes shake-slow {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-4px);
  }
  75% {
    transform: translateY(4px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-shake-slow {
  animation: shake-slow 2s ease-in-out infinite;
}

.animate-modal-in {
  animation: modal-in 300ms ease-out;
}

/* Mejoras de tipografía */
.font-display {
  letter-spacing: -0.02em;
  font-weight: 400;
}

/* Efectos de hover mejorados */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(45, 80, 22, 0.2);
}

/* Gradientes de marca */
.gradient-brand {
  background: linear-gradient(135deg, var(--gd-color-forest) 0%, var(--gd-color-leaf) 50%, var(--gd-color-avocado) 100%);
}

.gradient-brand-text {
  background: linear-gradient(135deg, var(--gd-color-forest) 0%, var(--gd-color-leaf) 50%, var(--gd-color-forest) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  animation: splash-fade 2s ease-out forwards;
}

.logo-splash__logo {
  position: relative;
  width: 100vw;
  height: 100vh;
  animation: splash-logo 2s ease-out forwards;
}
```

### 3.3 Variables CSS Principales

**Colores de Marca:**
- `--gd-color-forest`: #2d5016 (Verde oscuro principal)
- `--gd-color-leaf`: #7db835 (Verde hoja)
- `--gd-color-sprout`: #d4e5b8 (Verde claro/brote)
- `--gd-color-avocado`: #6a994e (Verde aguacate)
- `--gd-color-sky`: #7dd3c0 (Azul cielo)
- `--gd-color-beige`: #f5f1e8 (Beige)
- `--gd-color-apple`: #e63946 (Rojo manzana)
- `--gd-color-strawberry`: #c1121f (Rojo fresa)
- `--gd-color-citrus`: #f77f00 (Naranja cítrico)

**Colores de Texto:**
- `--gd-color-text`: #1a1a1a
- `--gd-color-text-muted`: #6c6c6c
- `--gd-color-border`: #e5e5e5

**Superficies:**
- `--gd-surface`: var(--gd-color-white)
- `--gd-surface-muted`: var(--gd-color-beige)

**Fuentes:**
- `--gd-font-sans`: var(--font-montserrat, "Montserrat", ...)
- `--gd-font-display`: var(--font-patua, "Patua One", ...)

---

## 4. MÓDULOS CRÍTICOS

### 4.1 Box Builder

#### 4.1.1 Estado del Box Builder
**Ruta:** `apps/web/src/modules/box-builder/state.ts`

**Tipo de Estado:**
```typescript
export type BuilderState = {
  boxId?: string;
  variant?: "mix" | "fruity" | "veggie"; // Variante de caja seleccionada
  mix?: "mix" | "frutas" | "vegetales";
  extras: string[];
  likes: string[];
  dislikes: string[];
  notes: string;
  highlightedProducts: string[];
  selectedProducts: Record<string, number>;
  deliveryZone?: string;
  deliveryDay?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};
```

**Almacenamiento:**
- **Storage Key:** `"gd-box-builder"`
- **Tipo:** `sessionStorage` (persiste solo durante la sesión del navegador)
- **Inicialización:** Carga desde `sessionStorage` al montar, guarda automáticamente en cada cambio

**Hook de Estado:**
```typescript
export function useBoxBuilderState() {
  const [state, setState] = useState<BuilderState>(() => {
    // Carga inicial desde sessionStorage
    try {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          extras: [],
          likes: [],
          dislikes: [],
          notes: "",
          highlightedProducts: [],
          ...parsed,
          selectedProducts: parsed.selectedProducts ?? {},
          contactName: parsed.contactName ?? "",
          contactEmail: parsed.contactEmail ?? "",
          contactPhone: parsed.contactPhone ?? "",
        };
      }
    } catch (error) {
      console.warn("Unable to load builder state", error);
    }
    return {
      extras: [],
      likes: [],
      dislikes: [],
      notes: "",
      highlightedProducts: [],
      selectedProducts: {},
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    state,
    updateState: (partial: Partial<BuilderState>) => setState((prev) => ({ ...prev, ...partial })),
    resetState: () => setState({ /* estado inicial */ }),
  };
}
```

#### 4.1.2 Context Provider
**Ruta:** `apps/web/src/modules/box-builder/context.tsx`

```typescript
"use client";

import { createContext, useContext } from "react";
import { useBoxBuilderState, type BuilderState } from "./state";

type BoxBuilderContextValue = {
  state: BuilderState;
  updateState: (partial: Partial<BuilderState>) => void;
  resetState: () => void;
};

const BoxBuilderContext = createContext<BoxBuilderContextValue | undefined>(undefined);

export function BoxBuilderProvider({ children }: { children: React.ReactNode }) {
  const value = useBoxBuilderState();
  return <BoxBuilderContext.Provider value={value}>{children}</BoxBuilderContext.Provider>;
}

export function useBoxBuilder() {
  const context = useContext(BoxBuilderContext);
  if (!context) {
    throw new Error("useBoxBuilder must be used within a BoxBuilderProvider");
  }
  return context;
}
```

#### 4.1.3 Cálculo de Extras
**Ruta:** `apps/web/src/modules/box-builder/utils.ts`

**Funciones Principales:**

1. **`computeSwapExtrasV2()`** - Calcula extras por swaps de productos:
   - Compara precio total de productos seleccionados vs productos base
   - Tolerancia: RD$ 10 (swaps menores a esta diferencia no generan extra)
   - Retorna la diferencia si es mayor a la tolerancia

2. **`computeACartaPrice()`** - Calcula precio cuando la caja pasa a "A la Carta":
   - Ocurre cuando se modifica más del 50% del contenido base
   - Precio = suma de precios individuales de productos (precio de catálogo o `wholesaleCost * 1.5`)

3. **`isCustomizedToACarta()`** - Detecta si la caja pasa a "A la Carta":
   - Cuenta productos base modificados
   - Si > 50% modificado, retorna `true`

4. **`computeBoxPrice()`** - Calcula precio final de la caja:
   ```typescript
   export function computeBoxPrice(
     boxId: string,
     boxBasePrice: number,
     selectedProducts: Record<string, number>,
     variant?: "mix" | "fruity" | "veggie",
     priceLookup?: PriceLookup,
   ): { price: number; isACarta: boolean; extras: number; savings?: number }
   ```
   - Si es "A la Carta": precio = suma individual, extras = 0
   - Si no: precio = precio base, extras = swaps calculados

5. **`computeSlots()`** - Calcula slots usados:
   - Suma `slotValue * quantity` de cada producto seleccionado

6. **`computeWeight()`** - Calcula peso total:
   - Suma `weightKg * quantity` de cada producto (default: 0.5 kg)

7. **`computeCost()`** - Calcula costo estimado:
   - Suma `wholesaleCost * quantity` de cada producto

8. **`checkBalanceIssues()`** - Detecta problemas de balance:
   - Verifica categorías faltantes según `categoryBudget` de la regla
   - Retorna issues críticos (solo faltantes, no excesos)

**Mapeo de Productos:**
- `setProductMetaMap()` - Construye mapa de metadatos desde array de productos
- `getProductMeta()` - Obtiene metadatos de un producto por slug
- `setBoxRulesMap()` - Construye mapa de reglas de cajas
- `getBoxRule()` - Obtiene regla de caja por ID (case-insensitive)

### 4.2 Cart (Carrito)

#### 4.2.1 Estado del Cart
**Ruta:** `apps/web/src/modules/cart/context.tsx`

**Tipo de Item:**
```typescript
export type CartItem = {
  slug: string;
  name: string;
  type: CartItemType; // "product" | "box"
  quantity: number;
  slotValue: number;
  weightKg: number;
  price: number;
  image?: string;
  notes?: string;
  excludedIngredients?: string[];
  configuration?: BoxConfiguration; // Solo para type === "box"
};

export type BoxConfiguration = {
  boxId: string;
  mix?: "mix" | "frutas" | "vegetales";
  variant?: "mix" | "fruity" | "veggie";
  selectedProducts: Record<string, number>;
  likes: string[];
  dislikes: string[];
  notes?: string;
  deliveryZone?: string;
  deliveryDay?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  price: {
    base: number;
    extras: number;
    final: number;
    isACarta: boolean;
  };
};
```

**Almacenamiento:**
- **Storage Keys:**
  - Usuario autenticado: `"gd-cart-{userId}"` en `localStorage`
  - Invitado: `"gd-cart-guest"` en `sessionStorage`
  - Legacy: `"gd-cart"` en `localStorage` (migrado automáticamente)

**Inicialización:**
1. Si usuario autenticado: carga desde `localStorage` con key específica del usuario
2. Si no hay carrito del usuario: intenta migrar desde `"gd-cart"` (legacy)
3. Si no hay legacy: carga desde `sessionStorage` (guest) y migra a `localStorage` del usuario
4. Si no hay usuario: carga desde `sessionStorage` (guest)

**Sincronización con Firestore:**
- Cuando el usuario está autenticado, el carrito se sincroniza automáticamente con Firestore
- Usa `cartItemsToFirestore()` para convertir formato
- Se guarda en el perfil del usuario bajo `profile.carrito`

#### 4.2.2 Métricas del Cart
**Tipo:**
```typescript
export type CartMetrics = {
  totalSlots: number;
  totalWeightKg: number;
  totalCost: number;
  itemCount: number;
};
```

**Cálculo:**
```typescript
function calculateMetrics(items: CartItem[]): CartMetrics {
  return items.reduce(
    (acc, item) => {
      const unitPrice = item.configuration?.price?.final ?? item.price;
      return {
        totalSlots: acc.totalSlots + item.slotValue * item.quantity,
        totalWeightKg: acc.totalWeightKg + item.weightKg * item.quantity,
        totalCost: acc.totalCost + unitPrice * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      };
    },
    { totalSlots: 0, totalWeightKg: 0, totalCost: 0, itemCount: 0 },
  );
}
```

**Nota:** Para cajas, el precio final se toma de `item.configuration.price.final` (incluye extras y ajustes de "A la Carta").

#### 4.2.3 Funciones del Cart
- **`addItem()`** - Agrega o actualiza item en el carrito
  - Si existe: incrementa cantidad y actualiza precio/imagen/configuration
  - Si no existe: agrega nuevo item
  - Dispara evento `"gd-cart-add"` en window

- **`updateQuantity()`** - Actualiza cantidad de un item
  - Si cantidad = 0, remueve el item

- **`removeItem()`** - Remueve item por slug

- **`clear()`** - Limpia todo el carrito

#### 4.2.4 Sincronización con Firestore
**Ruta:** `apps/web/src/modules/cart/firestore-sync.ts`

```typescript
export function cartItemToFirestore(item: CartItem): CartItemFromFirestore {
  if (item.type === "box" && item.configuration) {
    const likes = item.configuration.likes ?? [];
    const dislikes = item.configuration.dislikes ?? [];
    return {
      tipo: "caja",
      nombre: item.name,
      precio: item.configuration.price?.final ?? item.price,
      variedad: item.configuration.variant || item.configuration.mix || "mix",
      preferencias: {
        like: likes,
        dislike: dislikes,
      },
      cantidad: item.quantity,
      autoMode: likes.length === 0 && dislikes.length === 0,
    };
  }

  const base: CartItemFromFirestore = {
    tipo: "producto",
    nombre: item.name,
    precio: item.price,
    cantidad: item.quantity,
  };
  if (item.notes) {
    base.notas = item.notes;
  }
  if (item.excludedIngredients?.length) {
    base.ingredientesExcluidos = item.excludedIngredients;
  }
  return base;
}

export function cartItemsToFirestore(items: CartItem[]): CartItemFromFirestore[] {
  return items.map(cartItemToFirestore);
}
```

---

## 5. DEPENDENCIAS - VERSIONES DE LIBRERÍAS

**Ruta:** `apps/web/package.json`

### 5.1 Dependencies (Producción)

```json
{
  "firebase": "^12.5.0",
  "framer-motion": "^12.23.24",
  "next": "^14.2.15",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hot-toast": "^2.6.0",
  "zod": "^4.1.12"
}
```

**Versiones Específicas:**
- **Next.js:** `^14.2.15` (App Router)
- **React:** `^18.2.0`
- **React DOM:** `^18.2.0`
- **Firebase SDK:** `^12.5.0`
- **Framer Motion:** `^12.23.24` (animaciones)
- **React Hot Toast:** `^2.6.0` (notificaciones)
- **Zod:** `^4.1.12` (validación de esquemas)

### 5.2 DevDependencies (Desarrollo)

```json
{
  "@types/node": "^18.19.0",
  "@types/react": "^18.2.48",
  "@types/react-dom": "^18.2.18",
  "autoprefixer": "10.4.20",
  "eslint": "^8.57.1",
  "eslint-config-next": "14.2.15",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.3.7",
  "typescript": "^5.5.4"
}
```

**Versiones Específicas:**
- **TypeScript:** `^5.5.4`
- **Tailwind CSS:** `^3.3.7`
- **PostCSS:** `^8.5.6`
- **Autoprefixer:** `10.4.20`
- **ESLint:** `^8.57.1`
- **ESLint Config Next:** `14.2.15`

### 5.3 Engines

```json
{
  "engines": {
    "node": ">=18.18.0"
  }
}
```

**Node.js:** Requiere versión `>=18.18.0`

---

## 6. ESTRUCTURA DE PROVIDERS

**Ruta:** `apps/web/src/app/providers.tsx`

**Jerarquía de Providers:**
```typescript
<AuthProvider>
  <LanguageProvider initialLocale={initialLocale}>
    <CatalogProvider>
      <CartProvider>
        <BoxBuilderProvider>
          <ToastProvider />
          {children}
        </BoxBuilderProvider>
      </CartProvider>
    </CatalogProvider>
  </LanguageProvider>
</AuthProvider>
```

**Orden de Dependencias:**
1. **AuthProvider** - Autenticación (base)
2. **LanguageProvider** - Internacionalización
3. **CatalogProvider** - Catálogo de productos (depende de API)
4. **CartProvider** - Carrito (depende de Auth para sincronización)
5. **BoxBuilderProvider** - Constructor de cajas (depende de Catalog)
6. **ToastProvider** - Notificaciones (UI)

---

## 7. RESUMEN DE ARQUITECTURA

### 7.1 Flujo de Datos
1. **SSR (Server-Side Rendering):** `page.tsx` carga datos iniciales desde API
2. **Cliente:** `CatalogProvider` carga datos desde rutas API (`/api/catalog/*`)
3. **Rutas API:** Actúan como proxy hacia backend API que se conecta a Firebase
4. **Firebase:** Solo se usa directamente para Auth, Storage y Firestore (perfil de usuario, carrito)

### 7.2 Estado Global
- **Box Builder:** `sessionStorage` (temporal, por sesión)
- **Cart:** `localStorage` (usuario) o `sessionStorage` (invitado)
- **Catalog:** Estado en memoria (Context)
- **Auth:** Firebase Auth
- **User Profile:** Firestore (sincronizado con carrito)

### 7.3 Estilos
- **Framework:** Tailwind CSS 3.3.7
- **Variables CSS:** Definidas en `globals.css`
- **Fuentes:** Google Fonts (Montserrat, Patua One)
- **Animaciones:** CSS keyframes + Framer Motion

---

## 8. NOTAS IMPORTANTES PARA MIGRACIÓN

1. **Firebase no se usa directamente para productos:** Los productos se cargan a través de una API intermedia
2. **SessionStorage vs LocalStorage:** Box Builder usa `sessionStorage`, Cart usa `localStorage` para usuarios autenticados
3. **Sincronización de Carrito:** El carrito se sincroniza automáticamente con Firestore cuando el usuario está autenticado
4. **Cálculo de Precios:** Los extras se calculan comparando precios totales, no producto por producto
5. **"A la Carta":** Se activa cuando se modifica >50% del contenido base de una caja
6. **Variables CSS:** Todas las variables de color y tipografía están en `globals.css`, no en Tailwind config
7. **API Base URL:** Debe configurarse en `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:5001/api`)

---

**Documento generado:** Análisis completo de la versión de seguridad funcional
**Fecha:** 2026-01-19
**Versión analizada:** V2 Definitiva (Seguridad)
