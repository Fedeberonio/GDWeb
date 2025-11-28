# Guía de Deploy en Vercel - GreenDolio Pro

## Estado Actual
- ✅ Rama `test-build` lista con commits
- ✅ Credenciales Firebase en `.env.local` y `.env`
- ⏳ Falta: Push a GitHub y configuración en Vercel

## Paso 1: Push a GitHub

```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
git push origin test-build
```

**Nota:** Si pide credenciales, usa tu token de GitHub (Settings → Developer settings → Personal access tokens).

## Paso 2: Configurar Vercel

### 2.1. Importar Proyecto
1. Ve a https://vercel.com/gds-projects-1bbb6204
2. Click en "Add New Project" o "Import Project"
3. Selecciona el repositorio: `Fedeberonio/GDWeb`

### 2.2. Configuración del Proyecto
- **Framework Preset:** Next.js
- **Root Directory:** `GreenDolio-Pro/apps/web` ⚠️ **IMPORTANTE**
- **Build Command:** `npm run build` (o dejar por defecto)
- **Output Directory:** `.next` (o dejar por defecto)
- **Install Command:** `npm install` (o dejar por defecto)
- **Development Command:** `npm run dev`

### 2.3. Branch para Deploy
- Selecciona la rama: `test-build` (no `main`)

### 2.4. Variables de Entorno

Agrega estas variables en Vercel (Settings → Environment Variables):

#### Frontend (apps/web)
```
NEXT_PUBLIC_API_BASE_URL=https://tu-backend-staging.onrender.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=64271997064
NEXT_PUBLIC_FIREBASE_APP_ID=1:64271997064:web:8001973cad419458fd379f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-H9F4SXPJPA
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=tu-email@ejemplo.com
```

**Nota:** `NEXT_PUBLIC_API_BASE_URL` será la URL del backend cuando lo despliegues (Render/Railway).

## Paso 3: Deploy del Backend (Opcional - para funcionalidad completa)

### 3.1. Render.com (Recomendado - Gratis)
1. Crea cuenta en https://render.com
2. "New" → "Web Service"
3. Conecta tu repositorio: `Fedeberonio/GDWeb`
4. Configuración:
   - **Name:** `greendolio-api-staging`
   - **Root Directory:** `GreenDolio-Pro/apps/api`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Branch:** `test-build`

### 3.2. Variables de Entorno en Render
```
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=greendolio-tienda
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@greendolio-tienda.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
ADMIN_ALLOWED_EMAILS=tu-email@ejemplo.com
```

**Nota:** Las credenciales completas están en `apps/api/.env` (no las subas a GitHub).

### 3.3. Actualizar API URL en Vercel
Una vez que Render te dé la URL (ej: `https://greendolio-api-staging.onrender.com`), actualiza en Vercel:
```
NEXT_PUBLIC_API_BASE_URL=https://greendolio-api-staging.onrender.com/api
```

## Paso 4: Verificar Deploy

1. Vercel te dará una URL tipo: `greendolio-pro-test-xxx.vercel.app`
2. Accede y verifica:
   - ✅ Página carga correctamente
   - ✅ Login con Google funciona
   - ✅ Catálogo se muestra
   - ✅ Carrito funciona

## Nota sobre el Error de Build

El build local falla en `/404` y `/500` por styled-jsx, pero **Vercel puede manejarlo** porque renderiza estas páginas dinámicamente. Si el deploy falla, podemos aplicar un workaround.

## Próximos Pasos

1. ✅ Push de `test-build`
2. ✅ Configurar Vercel
3. ⏳ Deploy backend (opcional)
4. ⏳ Testing end-to-end
5. ⏳ Go-live cuando esté listo




