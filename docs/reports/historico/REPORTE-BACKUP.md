# REPORTE TÉCNICO - BACKUP V2.0
## Análisis para Migración a Producción con Base de Datos Staging

**Fecha:** 2026-01-24  
**Versión Analizada:** Backup v2.0 (Diseño Visual Correcto + Funciones Avanzadas)  
**Objetivo:** Migración a estructura limpia de producción con conexión a Staging

---

## 🌲 ESTRUCTURA DE ARCHIVOS

### Tipo de Proyecto: **MONOREPO**

**Confirmación:** Sí, es un monorepo con estructura `apps/`

```
GreenDolio-Pro copy 14/
├── apps/
│   ├── api/                    # Backend API (Express/Fastify)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── catalog/    # Servicio de catálogo
│   │   │   │   ├── boxes/      # Lógica de cajas
│   │   │   │   ├── orders/     # Gestión de pedidos
│   │   │   │   └── users/      # Gestión de usuarios
│   │   │   ├── firebaseAdmin.ts
│   │   │   └── lib/firestore.ts
│   │   └── package.json
│   │
│   └── web/                    # Frontend Next.js
│       ├── src/
│       │   ├── app/            # App Router (Next.js 14)
│       │   │   ├── _components/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── globals.css
│       │   ├── lib/
│       │   │   ├── firebase/   # Cliente Firebase
│       │   │   └── config/     # Configuración de entorno
│       │   └── modules/
│       │       ├── auth/       # Autenticación
│       │       ├── catalog/    # Catálogo (cliente)
│       │       ├── cart/       # Carrito
│       │       ├── box-builder/# Constructor de cajas
│       │       └── i18n/       # Internacionalización
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── package.json
│
├── package.json                # Root workspace config
└── [documentación y assets]
```

**Workspace Configuration (Root `package.json`):**
```json
{
  "name": "green-dolio-pro",
  "workspaces": [
    "apps/web",
    "apps/api"
  ],
  "scripts": {
    "dev:web": "npm --workspace apps/web run dev",
    "dev:api": "npm --workspace apps/api run dev",
    "build": "npm run build --workspaces"
  }
}
```

**Respuesta Clave:** ✅ **Es un monorepo** con:
- `apps/web`: Frontend Next.js 14 (App Router)
- `apps/api`: Backend API que se conecta a Firebase

---

## 🎨 ADN VISUAL (Para Preservar)

### 1. Variables CSS y Clases Especiales

**Archivo:** `apps/web/src/app/globals.css`

**Primeras 20 líneas:**
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
```

**Clases Especiales Identificadas:**

✅ **`.glass-panel`** - Efecto glassmorphism:
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
```

✅ **`.logo-splash`** - Animación de splash screen:
```css
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

✅ **Variables de Color Principales:**
- `--gd-color-forest`: #2d5016 (Verde oscuro principal)
- `--gd-color-leaf`: #7db835 (Verde hoja)
- `--gd-color-sprout`: #d4e5b8 (Verde claro/brote)
- `--gd-color-avocado`: #6a994e (Verde aguacate)
- `--gd-color-sky`: #7dd3c0 (Azul cielo)
- `--gd-color-beige`: #f5f1e8 (Beige)

✅ **Otras Clases Importantes:**
- `.shadow-soft` - Sombra suave
- `.shadow-soft-lg` - Sombra suave grande
- `.gradient-brand` - Gradiente de marca
- `.gradient-brand-text` - Texto con gradiente
- `.hover-lift` - Efecto hover con elevación
- `.animate-float`, `.animate-pulse-glow`, `.animate-shake` - Animaciones

### 2. Fuentes y Layout

**Archivo:** `apps/web/src/app/layout.tsx`

**Fuentes Cargadas:**
```typescript
import { Montserrat, Patua_One } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const patuaOne = Patua_One({
  subsets: ["latin"],
  variable: "--font-patua",
  weight: "400",
  display: "swap",
});
```

**Providers que Envuelven la App:**
```typescript
<Providers initialLocale={initialLocale}>
  {children}
  <ConditionalSocialButtons />
  <AuthModal />
  <ProfileFormModal />
</Providers>
```

**Jerarquía de Providers (en `providers.tsx`):**
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

### 3. Navbar con Selector de Idiomas

**Archivo:** `apps/web/src/app/_components/primary-nav.tsx`

**Confirmación:** ✅ **Sí tiene selector de idiomas con banderas**

**Código del Selector:**
```typescript
import { LanguageToggle } from "./language-toggle";

// En el JSX:
<div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
  <CartNavButton />
  <UserAuthButton />
  <LanguageToggle />  {/* ← Selector de idiomas */}
</div>
```

**Componente `LanguageToggle` (`language-toggle.tsx`):**
```typescript
"use client";

import { useLocale } from "@/modules/i18n/context";

const LOCALE_FLAGS: Record<string, string> = {
  es: "🇩🇴",  // Bandera República Dominicana
  en: "🇺🇸",  // Bandera Estados Unidos
};

export function LanguageToggle() {
  const { locale, locales, labels, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-1 py-1 text-xs shadow-sm">
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-label={labels[code]}
            title={labels[code]}
            className={`rounded-full px-3 py-1 font-medium transition ${
              active ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-base leading-none">{LOCALE_FLAGS[code] ?? "🌐"}</span>
          </button>
        );
      })}
    </div>
  );
}
```

**Características del Navbar:**
- Sticky header con `backdrop-blur-md`
- Logo con imagen `/images/logo/logo-vertical.png`
- Enlaces de navegación: Cajas, Combos, Catálogo, Sobre Nosotros
- Botones: Carrito, Autenticación, Selector de Idioma (con banderas)
- Estilos: `bg-white/98 shadow-lg backdrop-blur-md border-b-2 border-[var(--gd-color-leaf)]/20`

---

## 🧠 LÓGICA DE NEGOCIO Y DATOS

### 1. Versiones de Dependencias

**Archivo:** `apps/web/package.json`

```json
{
  "dependencies": {
    "firebase": "^12.5.0",
    "framer-motion": "^12.23.24",
    "next": "^14.2.15",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.6.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
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
}
```

**Versiones Clave:**
- ✅ **Next.js:** `^14.2.15` (App Router)
- ✅ **React:** `^18.2.0`
- ✅ **Firebase SDK:** `^12.5.0`
- ✅ **Tailwind CSS:** `^3.3.7`
- ✅ **Framer Motion:** `^12.23.24` (animaciones)
- ✅ **TypeScript:** `^5.5.4`
- ✅ **Zod:** `^4.1.12` (validación)

### 2. Configuración de Firebase

**Archivo:** `apps/web/src/lib/firebase/client.ts`

**Inicialización:**
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

**Uso de Firebase:**
- ✅ **Auth:** Google Authentication
- ✅ **Firestore:** Base de datos (perfiles de usuario, carrito)
- ✅ **Storage:** Almacenamiento de imágenes
- ✅ **Analytics:** Google Analytics (opcional)

### 3. Servicio de Catálogo

**Archivo:** `apps/web/src/modules/catalog/api.ts`

**Arquitectura:** ❌ **NO carga productos directamente desde Firebase**

**En su lugar, usa una API intermedia:**

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

**Flujo de Datos:**
1. **Frontend (Next.js):** Llama a `/api/catalog/*` (rutas API de Next.js)
2. **Rutas API Next.js:** Actúan como proxy hacia `apps/api`
3. **Backend API (`apps/api`):** Se conecta a Firebase/Firestore para obtener datos
4. **Firebase/Firestore:** Base de datos real

**Variable de Entorno:**
- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:5001/api`)

**Configuración de Entorno (`apps/web/src/lib/config/env.ts`):**
```typescript
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:5001/api"),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  // ... otras variables de Firebase
});
```

**Respuesta Clave:** 
- ❌ **NO usa JSON local** para productos
- ❌ **NO se conecta directamente a Firestore** desde el cliente
- ✅ **Usa API intermedia** (`apps/api`) que sí se conecta a Firebase

---

## ⚙️ CONFIGURACIÓN DEL BUILD

### 1. Next.js Config

**Archivo:** `apps/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "greendolio.shop",
      },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizeCss: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /styled-jsx/ },
        { message: /useContext/ },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
```

**Características:**
- ✅ Configuración de imágenes remotas (Google Storage, Firebase Storage, dominio propio)
- ✅ TypeScript y ESLint habilitados en build
- ✅ Optimización CSS deshabilitada (`optimizeCss: false`)
- ✅ Webpack configurado para ignorar warnings específicos en servidor

### 2. Tailwind Config

**Archivo:** `apps/web/tailwind.config.js`

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

**Nota:** La configuración es mínima. Las extensiones de tema se definen principalmente mediante **variables CSS** en `globals.css`, no en Tailwind config.

**PostCSS Config:** Probablemente existe `postcss.config.js` (estándar de Next.js)

---

## 📋 RESUMEN EJECUTIVO

### ✅ Confirmaciones Clave

1. **Estructura:** ✅ Monorepo con `apps/web` y `apps/api`
2. **ADN Visual:**
   - ✅ Variables CSS completas (`--gd-color-*`)
   - ✅ Clases especiales: `.glass-panel`, `.logo-splash`
   - ✅ Fuentes: Montserrat + Patua One
   - ✅ Selector de idiomas con banderas 🇩🇴 🇺🇸
3. **Tecnologías:**
   - ✅ Next.js 14.2.15 (App Router)
   - ✅ Firebase 12.5.0
   - ✅ Tailwind 3.3.7
   - ✅ TypeScript 5.5.4
4. **Arquitectura de Datos:**
   - ✅ Frontend → API Next.js → Backend API → Firebase/Firestore
   - ✅ NO carga productos directamente desde Firebase en cliente
   - ✅ Usa API intermedia para seguridad y control

### 🎯 Puntos Críticos para Migración

1. **Variables de Entorno:**
   - Configurar `NEXT_PUBLIC_API_BASE_URL` para apuntar a Staging
   - Configurar todas las variables de Firebase para Staging
   - Mantener estructura de validación con Zod

2. **Preservar ADN Visual:**
   - Copiar `globals.css` completo (variables + clases + animaciones)
   - Mantener fuentes Google (Montserrat, Patua One)
   - Preservar componente `LanguageToggle` con banderas

3. **Arquitectura de Datos:**
   - Backend API (`apps/api`) debe conectarse a Firestore Staging
   - Frontend debe apuntar a API de Staging
   - Mantener estructura de monorepo

4. **Build Configuration:**
   - Mantener `next.config.js` con configuraciones de imágenes
   - Tailwind config es mínima (depende de CSS variables)
   - TypeScript y ESLint habilitados

### 🔄 Pasos Recomendados para Migración

1. **Preparación:**
   - Crear proyecto Firebase Staging
   - Configurar variables de entorno Staging
   - Verificar que Backend API pueda conectarse a Staging

2. **Migración de Código:**
   - Copiar estructura completa de `apps/web/src`
   - Copiar `globals.css` completo
   - Copiar configuración de `next.config.js` y `tailwind.config.js`
   - Copiar Providers y Contexts

3. **Migración de Datos:**
   - Exportar datos de producción/backup
   - Importar a Firestore Staging
   - Verificar integridad de datos

4. **Testing:**
   - Verificar que todas las variables CSS funcionan
   - Probar selector de idiomas
   - Verificar carga de productos desde API
   - Probar autenticación con Firebase Staging

---

**Documento generado:** Reporte técnico completo para migración  
**Versión analizada:** Backup v2.0  
**Estado:** ✅ Listo para migración a Staging
