# 🚀 Redeploy en Vercel - Instrucciones Inmediatas

## ✅ Estado Actual
- ✅ Cambios guardados localmente en `test-build`
- ✅ Commit: "Simplificar mensaje de WhatsApp: solo método de pago sin links ni instrucciones adicionales"
- ✅ Proyecto "gd-web" conectado a `Fedeberonio/GDWeb` en Vercel
- ⚠️ Preview con error visible en el dashboard

## 🎯 Opción 1: Redeploy desde Vercel Dashboard (RECOMENDADO - 2 minutos)

### Paso 1: Ir al Proyecto
1. En el dashboard de Vercel, click en el proyecto **"gd-web"**
2. O ve directamente a: `https://vercel.com/gds-projects-1bbb6204/gd-web`

### Paso 2: Ir a Deployments
1. Click en la pestaña **"Deployments"** en el menú superior
2. Verás la lista de deployments

### Paso 3: Crear Nuevo Deployment
1. Click en el botón **"Create Deployment"** (arriba a la derecha)
2. En el modal que aparece:
   - **Branch:** Selecciona `test-build` (o `main` si test-build no está disponible)
   - **Root Directory:** `apps/web` ⚠️ **MUY IMPORTANTE**
   - **Framework Preset:** `Next.js`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Click en **"Deploy"**

### Paso 4: Esperar y Verificar
1. Espera 2-3 minutos mientras Vercel construye
2. Una vez completado, tendrás una nueva URL de preview
3. Click en la URL para probar la app

---

## 🎯 Opción 2: Verificar y Corregir el Deployment con Error

Si quieres corregir el preview que muestra error:

### Paso 1: Abrir el Deployment con Error
1. En el dashboard, busca el preview que dice "Error"
2. Click en ese deployment para abrirlo

### Paso 2: Ver los Logs
1. En la página del deployment, ve a la pestaña **"Logs"**
2. Revisa qué error está ocurriendo
3. Los errores comunes son:
   - Root Directory incorrecto (debe ser `apps/web`)
   - Variables de entorno faltantes
   - Errores de build

### Paso 3: Corregir y Redeploy
1. Si el problema es la configuración, ve a **Settings** → **General**
2. Verifica que:
   - **Root Directory:** `apps/web`
   - **Production Branch:** `test-build` o `main`
3. Vuelve a **Deployments** y haz **"Redeploy"**

---

## 🎯 Opción 3: Hacer Push Primero (si tienes token)

Si prefieres hacer push primero para que Vercel detecte automáticamente:

### Paso 1: Crear Token de GitHub
1. Ve a: https://github.com/settings/tokens/new
2. Nombre: "GDWeb Push"
3. Permisos: marca `repo`
4. Genera y copia el token

### Paso 2: Hacer Push
En tu terminal:
```bash
git push https://TU_TOKEN@github.com/Fedeberonio/GDWeb.git test-build
```

### Paso 3: Vercel Detectará Automáticamente
1. Vercel detectará el nuevo push
2. Creará automáticamente un nuevo deployment
3. Espera 2-3 minutos

---

## ✅ Verificar que Funciona

Una vez desplegado, verifica:

1. **URL del Deployment:** Vercel te dará una URL tipo `gd-web-xxx.vercel.app`
2. **Probar la App:**
   - Abre la URL
   - Agrega productos al carrito
   - Ve a checkout
   - Llena el formulario
   - Confirma el pedido
   - Verifica que el mensaje de WhatsApp solo muestre el método de pago (sin links)

---

## 🔧 Si el Deploy Falla

### Error: "Root Directory does not exist"
- **Solución:** Verifica que el Root Directory sea exactamente `apps/web` (no `GreenDolio-Pro/apps/web`)

### Error: "Build failed"
- **Solución:** 
  1. Ve a **Settings** → **Environment Variables**
  2. Verifica que todas las 9 variables de Firebase estén configuradas
  3. Revisa los logs del deployment para ver el error específico

### Error: Variables de entorno faltantes
- **Solución:** Agrega estas variables en **Settings** → **Environment Variables**:
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

---

## 📝 Cambios Incluidos

- ✅ Mensaje de WhatsApp simplificado
- ✅ Solo método de pago (sin links)
- ✅ Nota: "Recibirás los detalles del pago por WhatsApp"

¡Listo para deploy! 🚀
