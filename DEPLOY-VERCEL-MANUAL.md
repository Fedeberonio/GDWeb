# 🚀 Deploy Manual en Vercel - Instrucciones

## ✅ Estado Actual
- ✅ Cambios guardados localmente en la rama `test-build`
- ✅ Commit realizado: "Simplificar mensaje de WhatsApp: solo método de pago sin links ni instrucciones adicionales"
- ⚠️ Push a GitHub pendiente (problema con acceso al repositorio)

## 📋 Opción 1: Deploy Manual desde Vercel Dashboard (RECOMENDADO)

### Paso 1: Acceder a Vercel
1. Ve a: https://vercel.com
2. Inicia sesión con tu cuenta
3. Busca el proyecto **"gd-web"** (o el nombre que tenga tu proyecto)

### Paso 2: Ir a Deployments
1. Click en **"Deployments"** en el menú superior
2. O ve directamente a: `https://vercel.com/gd-web/deployments`

### Paso 3: Crear Nuevo Deployment
1. Click en el botón **"Create Deployment"** o **"Deploy"**
2. Selecciona:
   - **Branch:** `test-build` (o `main` si no existe test-build)
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web` ⚠️ IMPORTANTE
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Paso 4: Verificar Variables de Entorno
Asegúrate de que estas variables estén configuradas en **Settings → Environment Variables**:

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

### Paso 5: Esperar el Deploy
1. Vercel comenzará a construir el proyecto
2. Espera 2-3 minutos
3. Una vez completado, tendrás una URL para probar

---

## 📋 Opción 2: Arreglar Git y Hacer Push

Si prefieres arreglar el acceso a GitHub:

### Paso 1: Verificar el Repositorio Correcto
1. Ve a GitHub y verifica cuál es el nombre exacto del repositorio
2. Verifica que tengas acceso de escritura

### Paso 2: Actualizar el Remoto
```bash
# Reemplaza con el repositorio correcto
git remote set-url origin https://github.com/USUARIO/REPOSITORIO.git
```

### Paso 3: Hacer Push
```bash
git push origin test-build
```

### Paso 4: Vercel Deploy Automático
Si Vercel está conectado al repositorio, hará deploy automáticamente cuando detecte el push.

---

## 🎯 Verificar el Deploy

Una vez completado el deploy:

1. **URL del Deployment:** Vercel te dará una URL tipo `gd-web-xxx.vercel.app`
2. **Probar la App:**
   - Abre la URL en el navegador
   - Verifica que la página carga correctamente
   - Prueba el flujo de checkout:
     - Agregar productos al carrito
     - Ir a checkout
     - Llenar el formulario
     - Confirmar pedido
     - Verificar que el mensaje de WhatsApp solo muestre el método de pago (sin links)

---

## ✅ Cambios Incluidos en este Deploy

- ✅ Mensaje de WhatsApp simplificado: solo muestra el método de pago
- ✅ Eliminados los links de PayPal del mensaje
- ✅ Eliminadas las instrucciones adicionales sobre métodos de pago
- ✅ Nota final: "Recibirás los detalles del pago por WhatsApp"

---

## 🆘 Si Necesitas Ayuda

Si el deploy falla:
1. Revisa los logs en Vercel (pestaña "Logs" del deployment)
2. Verifica que el Root Directory sea `apps/web`
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que el Build Command sea `npm run build`
