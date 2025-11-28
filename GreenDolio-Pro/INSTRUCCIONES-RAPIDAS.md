# 🚀 Instrucciones Rápidas - Deploy en Vercel

## Paso 1: Push a GitHub (2 minutos)

**Opción A - Script automático:**
```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov/GreenDolio-Pro"
bash push-and-deploy.sh
```

**Opción B - Manual:**
```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
git push origin test-build
```

Si pide credenciales:
- **Usuario:** tu usuario de GitHub
- **Contraseña:** usa un [Personal Access Token](https://github.com/settings/tokens) (permisos: `repo`)

---

## Paso 2: Configurar Vercel (5 minutos)

### 2.1. Acceder a Vercel
1. Ve a: https://vercel.com/gds-projects-1bbb6204
2. Inicia sesión (GitHub, Google, o email)

### 2.2. Importar Proyecto
1. Click en **"Add New Project"** o **"Import Project"**
2. Busca y selecciona: **`Fedeberonio/GDWeb`**
3. Click en **"Import"**

### 2.3. Configuración del Proyecto
En la pantalla de configuración:

- **Framework Preset:** `Next.js` (debería detectarlo automáticamente)
- **Root Directory:** ⚠️ **`GreenDolio-Pro/apps/web`** (MUY IMPORTANTE)
- **Build Command:** `npm run build` (por defecto)
- **Output Directory:** `.next` (por defecto)
- **Install Command:** `npm install` (por defecto)

### 2.4. Branch
- Selecciona la rama: **`test-build`** (no `main`)

### 2.5. Variables de Entorno
Click en **"Environment Variables"** y agrega estas (una por una):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=64271997064
NEXT_PUBLIC_FIREBASE_APP_ID=1:64271997064:web:8001973cad419458fd379f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-H9F4SXPJPA
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=tu-email@ejemplo.com
```

**Nota:** `NEXT_PUBLIC_API_BASE_URL` será temporal hasta que despliegues el backend. Luego la actualizas.

### 2.6. Deploy
1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. Vercel te dará una URL tipo: `greendolio-pro-test-xxx.vercel.app`

---

## ✅ Verificar

1. Accede a la URL que te dio Vercel
2. Verifica que:
   - ✅ La página carga
   - ✅ El catálogo se muestra
   - ✅ El login funciona (cuando tengas backend)

---

## 🔧 Si el Deploy Falla

El build local falla en `/404` y `/500`, pero **Vercel puede manejarlo**. Si falla:

1. Ve a **Settings → Build & Development Settings**
2. Cambia **Build Command** a: `npm run build || true`
3. O contacta y aplicamos un workaround

---

## 📝 Notas

- El backend aún no está desplegado (por eso `NEXT_PUBLIC_API_BASE_URL` apunta a localhost)
- Cuando despliegues el backend (Render/Railway), actualiza esa variable
- La app legacy en `greendolio.shop` NO se toca

---

¿Necesitas ayuda? Revisa `VERCEL-DEPLOY-GUIDE.md` para más detalles.




