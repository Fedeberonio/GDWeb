# 🚀 Instrucciones Completas - Deploy en Vercel

## ✅ Estado Actual
- ✅ Rama `test-build` en GitHub (5/5 checks pasando)
- ✅ Proyecto completo en `GreenDolio-Pro/`
- ✅ Cuenta correcta de Vercel logueada

## 📋 Paso a Paso Completo

### Paso 1: Ir a Vercel
1. Ve a: https://vercel.com
2. Asegúrate de estar logueado con la cuenta correcta
3. Click en **"Add New..."** (arriba a la derecha)
4. Selecciona **"Project"**

### Paso 2: Importar el Repositorio
1. En la sección **"Import Git Repository"**, verifica que el dropdown muestre **"Fedeberonio"**
2. Deberías ver el repositorio **"GDWeb"** en la lista
3. Click en el botón **"Import"** que está al lado de "GDWeb"

### Paso 3: Configuración del Proyecto
En la pantalla de configuración que aparece:

#### 3.1. Información Básica
- **Project Name:** Déjalo como está o cámbialo a `greendolio-pro` (opcional)
- **Vercel Team:** Selecciona tu equipo (ej: "GD's projects")

#### 3.2. Framework Preset
- **Framework Preset:** Debería detectar automáticamente `Next.js`
- Si no, selecciónalo manualmente del dropdown

#### 3.3. Root Directory ⚠️ IMPORTANTE
- **Root Directory:** Cambia a: `GreenDolio-Pro/apps/web`
- Esto le dice a Vercel dónde está el proyecto Next.js

#### 3.4. Build Settings
- **Build Command:** `npm run build` (debería estar por defecto)
- **Output Directory:** `.next` (debería estar por defecto)
- **Install Command:** `npm install` (debería estar por defecto)

#### 3.5. Git Configuration ⚠️ CRÍTICO
- Busca la sección **"Git"** o **"Repository"**
- Verás algo como **"Branch: main"**
- **CAMBIA esto a:** `test-build`
- Esto es CRÍTICO porque en `main` no existe `GreenDolio-Pro/apps/web`

### Paso 4: Variables de Entorno
Click en **"Environment Variables"** y agrega estas 9 variables (una por una):

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
1. Click en **"Add"** o **"Add Environment Variable"**
2. **Name:** Pega el nombre (ej: `NEXT_PUBLIC_API_BASE_URL`)
3. **Value:** Pega el valor
4. **Environment:** Selecciona "Production", "Preview", y "Development" (o solo "Production" si quieres)
5. Click en **"Save"**

### Paso 5: Deploy
1. Revisa que todo esté correcto:
   - ✅ Framework: Next.js
   - ✅ Root Directory: `GreenDolio-Pro/apps/web`
   - ✅ Branch: `test-build`
   - ✅ Variables de entorno: 9 agregadas
2. Click en **"Deploy"**
3. Espera 2-3 minutos mientras Vercel:
   - Clona el repositorio desde `test-build`
   - Instala dependencias
   - Hace el build
   - Despliega

### Paso 6: Verificar el Deploy
1. Una vez completado, Vercel te dará una URL tipo:
   - `greendolio-pro-xxx.vercel.app`
2. Click en la URL para ver tu app
3. Verifica que:
   - ✅ La página carga
   - ✅ El catálogo se muestra
   - ✅ Las imágenes cargan
   - ✅ La navegación funciona

## 🔧 Si el Deploy Falla

### Error: "Root Directory does not exist"
- **Causa:** Vercel está usando la rama `main` en lugar de `test-build`
- **Solución:**
  1. Ve a **Settings → Git**
  2. Cambia **"Production Branch"** de `main` a `test-build`
  3. Guarda
  4. Ve a **Deployments** y haz **"Redeploy"**

### Error: "Build failed"
- Revisa los logs en Vercel
- Verifica que todas las variables de entorno estén correctas
- Asegúrate de que el Root Directory sea exactamente: `GreenDolio-Pro/apps/web`

### Error: Variables de entorno faltantes
- Ve a **Settings → Environment Variables**
- Verifica que las 9 variables estén agregadas
- Asegúrate de que estén habilitadas para "Production"

## 📝 Checklist Final

Antes de hacer deploy, verifica:

- [ ] Framework: `Next.js`
- [ ] Root Directory: `GreenDolio-Pro/apps/web`
- [ ] Branch: `test-build` (NO `main`)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Variables de entorno: 9 agregadas
- [ ] Vercel Team: Seleccionado correctamente

## 🎯 Después del Deploy Exitoso

1. **URL del Deploy:** Vercel te dará una URL tipo `greendolio-pro-xxx.vercel.app`
2. **Prueba la App:** Accede a la URL y verifica que todo funcione
3. **Nota:** El backend aún no está desplegado, así que login/carrito no funcionarán aún
4. **Próximo Paso (Opcional):** Deploy del backend en Render/Railway para funcionalidad completa

## 🔒 Seguridad

- ✅ La página en producción (`greendolio.shop`) NO se toca
- ✅ Este es un deploy de testing en URL separada
- ✅ Puedes experimentar sin riesgo

## 📞 Si Necesitas Ayuda

Si algo falla:
1. Revisa los logs en Vercel (pestaña "Logs")
2. Verifica que la rama sea `test-build`
3. Verifica que el Root Directory sea correcto
4. Avísame y te ayudo a solucionarlo

¡Listo para deploy! 🚀










