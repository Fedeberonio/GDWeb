# 🔧 Configurar Variables de Entorno en Vercel

## URL del Deployment Preview
**https://web-ndy4upi5o-aimanagements-projects.vercel.app**

## ⚠️ Problema Actual
El deployment está fallando porque faltan las variables de entorno de Firebase.

## ✅ Solución: Agregar Variables en Vercel

### Paso 1: Ir a la Configuración del Proyecto
1. Ve a: https://vercel.com/aimanagements-projects/web/settings/environment-variables
2. O navega: Vercel Dashboard → `web` → Settings → Environment Variables

### Paso 2: Agregar las Variables

Agrega estas variables **una por una** para los ambientes: **Production, Preview, Development**

#### Variables Requeridas:

```
NEXT_PUBLIC_API_BASE_URL
Valor: http://localhost:5001/api
(Actualiza esto cuando despliegues el backend)

NEXT_PUBLIC_FIREBASE_API_KEY
Valor: [Tu API Key de Firebase]

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Valor: greendolio-tienda.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID
Valor: greendolio-tienda

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Valor: greendolio-tienda.appspot.com

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Valor: 64271997064

NEXT_PUBLIC_FIREBASE_APP_ID
Valor: 1:64271997064:web:8001973cad419458fd379f

NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
Valor: G-H9F4SXPJPA
(Opcional)

NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS
Valor: [tu-email@ejemplo.com]
(Opcional, separa múltiples emails con comas)
```

### Paso 3: Obtener los Valores Reales

Los valores reales están en tu archivo local:
- `apps/web/.env.local`

**IMPORTANTE:** No compartas estos valores públicamente. Son credenciales sensibles.

### Paso 4: Redeploy

Después de agregar las variables:
1. Ve a: https://vercel.com/aimanagements-projects/web/deployments
2. Encuentra el deployment `web-ndy4upi5o-aimanagements-projects.vercel.app`
3. Click en los tres puntos (⋯) → **"Redeploy"**
4. O haz un nuevo deploy desde la CLI:

```bash
cd apps/web
vercel --prod=false
```

## 🚀 Alternativa: Deploy con Variables desde CLI

Si prefieres hacerlo desde la terminal, puedes hacer un nuevo deploy especificando las variables:

```bash
cd apps/web
vercel --prod=false \
  -e NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com \
  -e NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda \
  -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com \
  -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=64271997064 \
  -e NEXT_PUBLIC_FIREBASE_APP_ID=1:64271997064:web:8001973cad419458fd379f
```

## ✅ Verificación

Una vez configuradas las variables y redeployado, la aplicación debería funcionar en:
**https://web-ndy4upi5o-aimanagements-projects.vercel.app**

Este es un **preview deployment** que NO afecta la producción actual.
