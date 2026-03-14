# 📋 GUÍA COMPLETA DE DEPLOYMENT - GreenDolio Pro v2.0

**Fecha:** 11 de Enero, 2026
**Repositorio:** https://github.com/greendolioexpress-creator/greendolio-pro-v2
**Cuenta Vercel:** greendolioexpress-1091
**Token GitHub:** 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

---

## 🎯 RESUMEN EJECUTIVO

Este proyecto está **completamente separado** de greendolio.shop (la versión en producción actual). Es una nueva versión (v2.0) con arquitectura moderna:

- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Backend:** Express + Firebase Admin
- **Arquitectura:** Monorepo con npm workspaces

---

## 📂 ESTRUCTURA DEL PROYECTO

```
GreenDolio-Pro copy/
├── apps/
│   ├── web/           ← Frontend Next.js (ESTO se despliega en Vercel)
│   └── api/           ← Backend Express (ESTO se despliega en Render)
├── data/              ← Datos y CSVs de productos
├── DataNuevaPro/      ← Datos actualizados (Nov 2025)
└── package.json       ← Root workspace
```

---

## 🔐 CREDENCIALES Y CONFIGURACIÓN

### GitHub
- **Repositorio:** https://github.com/greendolioexpress-creator/greendolio-pro-v2
- **Usuario:** greendolioexpress-creator
- **Token:** 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
- **Scope:** `repo` (full control)

### Vercel
- **Cuenta:** greendolioexpress-1091
- **Proyecto:** greendolio-pro-v2-web
- **Dashboard:** https://vercel.com/gds-projects-1bbb6204/greendolio-pro-v2-web

### Firebase
- **Project ID:** greendolio-tienda
- **Storage Bucket:** greendolio-tienda.appspot.com

---

## 🚀 PROCESO DE DEPLOYMENT - PASO A PASO

### PASO 1: Hacer Cambios al Código

```bash
# Navegar al proyecto
cd "/Users/aimac/Documents/GreenDolio-Pro copy"

# Ver archivos modificados
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "descripción de los cambios"
```

### PASO 2: Subir a GitHub

```bash
# Push al repositorio remoto
git push origin main
```

**IMPORTANTE:** Si te pide autenticación:
- **Username:** greendolioexpress-creator
- **Password:** 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 (el token, NO tu contraseña)

### PASO 3: Deployment Automático en Vercel

Una vez que hagas push a GitHub:

1. **Vercel detecta el cambio automáticamente** y empieza a hacer build
2. **Ve al dashboard:** https://vercel.com/gds-projects-1bbb6204/greendolio-pro-v2-web
3. **Espera 2-3 minutos** mientras hace el build
4. **Cuando termine**, verás "Deployment Ready" o "Ready"
5. **Click en "Visit"** para ver la URL en vivo

**Si NO se dispara automáticamente:**
1. Ve al dashboard de Vercel
2. Click en "Deployments"
3. Click en "Redeploy" en el último deployment
4. Confirma "Redeploy"

---

## ⚙️ CONFIGURACIÓN DE VERCEL

### Variables de Entorno Configuradas

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=64271997064
NEXT_PUBLIC_FIREBASE_APP_ID=1:64271997064:web:8001973cad419458fd379f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-H9F4SXPJPA
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=greendolioexpress@gmail.com,fberon@gmail.com,alcantaramariel60@gmail.com
```

### Configuración del Proyecto

- **Framework:** Next.js
- **Root Directory:** `apps/web` ⚠️ **MUY IMPORTANTE**
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x

---

## 🔧 DEPLOYMENT DEL BACKEND (Pendiente)

El backend aún NO está desplegado. Por eso `NEXT_PUBLIC_API_BASE_URL` apunta a localhost.

### Para Desplegar el Backend:

1. **Crear cuenta en Render.com:** https://render.com/
2. **Conectar GitHub:** Autorizar acceso al repositorio
3. **Crear nuevo Web Service:**
   - **Repository:** greendolioexpress-creator/greendolio-pro-v2
   - **Root Directory:** `apps/api`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

4. **Agregar Environment Variables en Render:**
```bash
PORT=5000
FIREBASE_PROJECT_ID=greendolio-tienda
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@greendolio-tienda.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEKeilCBlaLiY3
r7mNFmv3gcSCa9ZjCWEJEWsJCml2rK33cFWTIb8j7kUKymcPh8CnvcWDkvs7mMtY
I9b8CIRDY7hrBUaJvoOhSNzX2GIMjkDG5jzjDjKE9HD/K1343SDd+wgQSNibLVbT
klyQ+StfcHKfJNiNKxXeMYpMEq7xwKSi4sMucQFRrjqntSAutYVkZVklYTjzbtrB
Xd1XRSEWuIf/yAspCUNjmJxvMTciHrk8DQagXUVAC0GvG02Uw/ET4gKCWI/ktCWk
NFxwftwBT8iGnqPDqdPtQV3kuj3wCBYgUfSg46eKOat3z+1OrpCiqNfwLK/u2iIX
8jUMVyZdAgMBAAECggEACaZItuX0voJcWzgDEAOGzARyt61/ow9ymfw+aetjDNVJ
phoJ5GsDTxlSntYeJwrF3LdU26TtRDBlhln8lbLPwM0YJNzIuSnP3O0rsfF6wN5D
JcjTI281ThceABHKNZEF8IcZM/94kK+bBxBuCpKhqJ6Sza0Frj7f/HYu6BDLBGjT
X7EH4+LRp1/w3EbPaTuK353nbADoH4irC/oj02Rp6siyEpYHkMmmhfjhWrcJqDuZ
8B2CIGq8Zd569Aj2P0tgtKF/Y5mWI630Tu0UfBEc1OYede3PnknZhN5H7J0dF+Dt
TrUWIauugQVfV+PJSD40smnX6Nf8lRM8RadFL+iCoQKBgQDlSWxZOEL+tnp2UULH
0GzewPlmHrusZLEpupibIBptnerCwhugqXFSHrnpz3jzrKbzAXu5jqt6Dqs6RXAa
1kgnZqxFx6EYWHIoo1NlsgmDWDVZe2aK8arPlPj4OWRKEHT8b4Ej3nL7eh5ONIrf
xo1QKc/pWOQj3IcrRbjZWo9UYQKBgQDbBJMqQ1cEce8o0sdB316SManQKklo3kry
wMHmQyNvOYfFi0t4beBUfuOihC6BJTy2fiPnsNDIFWnLXPRMfuIxS644vcST/6Fg
2U17cHGtg+R9tOqnhE1B2l2DKnYTnw/S6lnyQNpXsxDz6DK5RPmxBg5DwNWBqQT+
VYartC/TfQKBgQDi/60QK55QNHLLfqoBzrxqUFzZmGWvSEUJjh4VvlPL4IMSbEAT
8I0rgxYGgAw8GttyTC6kx7XG8ozc9PAG8cyfjYvSzdAUnUPwLbqcPQYkDglLXNtp
hdbZCqDuh0td9CsN3Ira6xmlFQK55FT1NMqk6bBYUlQTmPoNgkp+jaTHIQKBgGzW
wStne37B/8+Rr2OU1TJha7n+yaxLi4NHNxRumNVVCZuptT+Lmsdip0zD0zhqgNlP
phglThugSIq/DshU5aMJsPKRm3bQuime01pcbqGDwbCWj2Xf4WSwV3gvSa5GhV6T
B0/T2q1qVypeYZagKFVIZR5WXcOpcsnRRrNdP8chAoGAaDPSPub8enCBWP4RX4u4
kEY1Wtf+Y31KNRZLV6OhOkP2vz0GNjN3yIaIYObXfXcEwMk1vnYKB/wiEz8mNudE
KD3vgthaMjBn+BBuUpl+wk3IAdxsVjAr78Z+e/r9qywdohPN8jZtWZbRsOPBXJsN
v5/yUdA9aZUHHdrmNkucdZc=
-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
ADMIN_ALLOWED_EMAILS=greendolioexpress@gmail.com,fberon@gmail.com,alcantaramariel60@gmail.com
```

5. **Esperar deployment** (5-10 minutos)
6. **Copiar la URL del backend** (ej: https://greendolio-api.onrender.com)
7. **Actualizar en Vercel:**
   - Ve a: Settings → Environment Variables
   - Edita `NEXT_PUBLIC_API_BASE_URL`
   - Nuevo valor: `https://greendolio-api.onrender.com/api`
   - Save
   - Redeploy el frontend

---

## 📊 ESTADO ACTUAL

### ✅ Completado
- [x] Código subido a GitHub
- [x] Repositorio configurado
- [x] Proyecto creado en Vercel
- [x] Variables de entorno configuradas
- [x] Root directory configurado (`apps/web`)
- [x] Commits recientes:
  - `0ed76acb` - feat: mejoras en checkout y catálogo
  - `c4d8a9b7` - fix: limpiar next.config.js para eliminar warnings

### ⏳ Pendiente
- [ ] **Activar auto-deployment en Vercel** (verificar que esté conectado al repo)
- [ ] **Desplegar el backend** en Render.com
- [ ] **Actualizar URL del API** en variables de Vercel
- [ ] **Probar funcionalidad completa** (login, carrito, checkout)

### ❌ NO Funciona Aún
- Login con Google (necesita backend)
- Carrito persistente (necesita backend)
- Checkout (necesita backend)
- Panel admin (necesita backend)

---

## 🔍 TROUBLESHOOTING

### El deployment no se activa automáticamente

1. Ve a Vercel Dashboard: https://vercel.com/gds-projects-1bbb6204/greendolio-pro-v2-web
2. Settings → Git
3. Verifica que esté conectado a: `greendolioexpress-creator/greendolio-pro-v2`
4. Production Branch: `main`
5. Si no está conectado, reconecta el repositorio

### Error de autenticación en git push

```bash
# Usar el token como password
Username: greendolioexpress-creator
Password: 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
```

### Ver logs del deployment en Vercel

1. Ve a: https://vercel.com/gds-projects-1bbb6204/greendolio-pro-v2-web
2. Click en el deployment más reciente
3. Scroll down para ver "Build Logs"

### Warnings en el build son normales

Estos warnings NO afectan el funcionamiento:
- Warning sobre `engines.node` → Es solo informativo
- Warning sobre páginas de error → Las páginas funcionan en runtime

---

## 📞 PRÓXIMOS PASOS

### Para Probar SOLO el Frontend (Actual):

1. Ve a Vercel Dashboard
2. Click en el deployment más reciente
3. Click en "Visit"
4. Podrás ver: UI, catálogo, navegación
5. NO funcionará: login, carrito, checkout

### Para Funcionalidad COMPLETA:

1. **Desplegar el backend** en Render (ver sección arriba)
2. **Actualizar `NEXT_PUBLIC_API_BASE_URL`** en Vercel
3. **Redeploy** el frontend
4. **Probar todo el flujo:** login → carrito → checkout

---

## 🔗 LINKS IMPORTANTES

- **Repositorio GitHub:** https://github.com/greendolioexpress-creator/greendolio-pro-v2
- **Vercel Dashboard:** https://vercel.com/gds-projects-1bbb6204/greendolio-pro-v2-web
- **Render.com:** https://render.com/ (para backend)
- **Firebase Console:** https://console.firebase.google.com/project/greendolio-tienda

---

## 🛡️ SEGURIDAD

**IMPORTANTE:** Este proyecto NO afecta a greendolio.shop:
- ✅ Repositorio diferente
- ✅ Deployment diferente
- ✅ URLs diferentes
- ✅ greendolio.shop sigue funcionando normalmente

---

**Última actualización:** 11 de Enero, 2026
**Autor:** Claude Code
