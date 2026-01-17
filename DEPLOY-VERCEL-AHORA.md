# 🚀 Deploy Inmediato en Vercel - Paso a Paso

## ✅ Estado Actual
- ✅ Cambios guardados localmente en la rama `test-build`
- ✅ Commit realizado: "Simplificar mensaje de WhatsApp: solo método de pago sin links ni instrucciones adicionales"
- ✅ Repositorio correcto: `Fedeberonio/GDWeb`

## 🎯 Deploy Manual desde Vercel (5 minutos)

Vercel puede hacer deploy directamente desde GitHub sin necesidad de hacer push primero.

### Paso 1: Acceder a Vercel
1. Ve a: **https://vercel.com**
2. Inicia sesión con tu cuenta (GitHub, Google, o email)

### Paso 2: Buscar o Crear el Proyecto
1. Busca el proyecto **"gd-web"** o **"GDWeb"** en tu dashboard
2. Si no existe, click en **"Add New..."** → **"Project"**

### Paso 3: Conectar el Repositorio
1. En **"Import Git Repository"**, busca: **`Fedeberonio/GDWeb`**
2. Si no aparece, click en **"Adjust GitHub App Permissions"** y asegúrate de tener acceso
3. Click en **"Import"** junto al repositorio

### Paso 4: Configurar el Deploy
En la pantalla de configuración:

**⚠️ CONFIGURACIÓN CRÍTICA:**
- **Framework Preset:** `Next.js` (debería detectarse automáticamente)
- **Root Directory:** `apps/web` ⚠️ **MUY IMPORTANTE**
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Branch:** `test-build` (o `main` si test-build no existe aún)

### Paso 5: Variables de Entorno
Click en **"Environment Variables"** y agrega estas variables:

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

**Para cada variable:**
1. Click en **"Add"**
2. **Name:** Pega el nombre (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. **Value:** Pega el valor
4. **Environment:** Selecciona "Production", "Preview", y "Development"
5. Click en **"Save"**

### Paso 6: Deploy
1. Revisa que todo esté correcto
2. Click en **"Deploy"**
3. Espera 2-3 minutos mientras Vercel construye y despliega

### Paso 7: Verificar
Una vez completado:
1. Vercel te dará una URL tipo: `gd-web-xxx.vercel.app`
2. Click en la URL para abrir la app
3. Prueba el flujo completo:
   - Agregar productos al carrito
   - Ir a checkout
   - Llenar el formulario
   - Confirmar pedido
   - Verificar que el mensaje de WhatsApp solo muestre el método de pago (sin links)

---

## 🔄 Si el Proyecto Ya Existe en Vercel

Si ya tienes el proyecto configurado:

### Opción A: Redeploy desde GitHub
1. Ve a **Deployments**
2. Click en **"Create Deployment"**
3. Selecciona:
   - **Branch:** `test-build`
   - **Root Directory:** `apps/web`
4. Click en **"Deploy"**

### Opción B: Actualizar Configuración y Redeploy
1. Ve a **Settings** → **General**
2. Verifica que:
   - **Root Directory:** `apps/web`
   - **Production Branch:** `test-build` (o la rama que uses)
3. Ve a **Deployments** → Click en el último deployment → **"Redeploy"**

---

## 📝 Cambios Incluidos en este Deploy

- ✅ Mensaje de WhatsApp simplificado
- ✅ Solo muestra el método de pago (Cash, Transferencia, PayPal, Tarjeta)
- ✅ Eliminados los links de PayPal
- ✅ Eliminadas las instrucciones adicionales
- ✅ Nota: "Recibirás los detalles del pago por WhatsApp"

---

## 🆘 Si Algo Falla

### Error: "Root Directory does not exist"
- Verifica que el Root Directory sea exactamente: `apps/web`
- Asegúrate de que la rama `test-build` tenga el código correcto

### Error: "Build failed"
- Revisa los logs en Vercel (pestaña "Logs")
- Verifica que todas las variables de entorno estén correctas
- Asegúrate de que el Build Command sea `npm run build`

### Error: Variables de entorno faltantes
- Ve a **Settings** → **Environment Variables**
- Verifica que las 9 variables estén agregadas
- Asegúrate de que estén habilitadas para "Production"

---

## ✅ Checklist Final

Antes de hacer deploy, verifica:
- [ ] Framework: `Next.js`
- [ ] Root Directory: `apps/web`
- [ ] Branch: `test-build`
- [ ] Build Command: `npm run build`
- [ ] Variables de entorno: 9 agregadas
- [ ] Vercel Team: Seleccionado correctamente

¡Listo para deploy! 🚀
