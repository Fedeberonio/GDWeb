# 🚀 Deployment en Render - Guía Paso a Paso

## 📋 PASO 1: Login en Render

1. Ve a https://dashboard.render.com
2. Haz clic en **"Sign in with GitHub"** (botón azul con el logo de GitHub)
3. Autoriza Render para acceder a tu cuenta de GitHub
4. Selecciona el repositorio **"GDWeb"** cuando te lo pida

---

## 📋 PASO 2: Crear Nuevo Web Service

1. Una vez en el dashboard, haz clic en el botón **"New +"** (arriba a la derecha)
2. Selecciona **"Web Service"**

---

## 📋 PASO 3: Conectar Repositorio

1. En la sección **"Connect a repository"**, busca y selecciona:
   - **Repositorio:** `Fedeberonio/GDWeb`
   - Si no aparece, haz clic en **"Configure account"** y autoriza el acceso

---

## 📋 PASO 4: Configurar el Servicio

Configura los siguientes valores:

### Configuración Básica:
- **Name:** `greendolio-web` (o el nombre que prefieras)
- **Region:** `Oregon (US West)` o `Ohio (US East)` (elige el más cercano)
- **Branch:** `test-build` ⚠️ **IMPORTANTE: Selecciona test-build**

### Configuración de Build:
- **Root Directory:** `apps/web` ⚠️ **IMPORTANTE**
- **Environment:** Selecciona **"Docker"** ⚠️ **CRÍTICO**
- **Dockerfile Path:** `apps/web/Dockerfile`
- **Docker Context:** `../../` (dos puntos, dos puntos, barra)

### Configuración Avanzada (opcional):
- **Auto-Deploy:** ✅ Activado (se redeploya automáticamente con cada push)

---

## 📋 PASO 5: Configurar Variables de Entorno

Haz clic en **"Advanced"** o busca la sección **"Environment Variables"** y agrega:

### Variables Requeridas:

```
NODE_ENV=production
```

```
NEXT_DISABLE_LIGHTNINGCSS=1
```

### Variables de Firebase (obtén los valores de tu proyecto Firebase):

```
NEXT_PUBLIC_API_BASE_URL=https://tu-api-url.com
FIREBASE_API_KEY=tu-api-key
FIREBASE_AUTH_DOMAIN=tu-auth-domain
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_STORAGE_BUCKET=tu-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
FIREBASE_APP_ID=tu-app-id
```

**Nota:** Si no tienes la URL de la API todavía, puedes usar una temporal o dejarla vacía. La aplicación usará datos estáticos como fallback.

---

## 📋 PASO 6: Configurar Health Check (Opcional pero Recomendado)

- **Health Check Path:** `/api/health`

Esto permite que Render verifique que tu aplicación está funcionando correctamente.

---

## 📋 PASO 7: Crear el Servicio

1. Revisa todas las configuraciones
2. Haz clic en **"Create Web Service"**
3. Render comenzará a construir la imagen Docker y desplegar la aplicación

---

## 📋 PASO 8: Monitorear el Build

1. Verás los logs del build en tiempo real
2. El proceso tomará aproximadamente 5-10 minutos
3. Busca mensajes como:
   - ✅ "Build completed successfully"
   - ✅ "Deploying..."
   - ✅ "Your service is live"

---

## 📋 PASO 9: Verificar el Deployment

1. Una vez completado, Render te dará una URL como:
   - `https://greendolio-web.onrender.com`
2. Visita la URL y verifica que la aplicación funcione
3. Prueba el health check: `https://tu-url.onrender.com/api/health`
   - Debe retornar: `{"status":"ok"}`

---

## 🐛 Troubleshooting

### Problema: Build falla con error de Dockerfile
- Verifica que el Dockerfile esté en `apps/web/Dockerfile`
- Verifica que el Docker Context sea `../../`
- Revisa los logs para ver el error específico

### Problema: "Cannot find module"
- Verifica que todas las variables de entorno estén configuradas
- Revisa que el Root Directory sea `apps/web`

### Problema: Aplicación no inicia
- Verifica los logs de runtime (no solo los de build)
- Asegúrate de que el puerto 3000 esté configurado
- Verifica que todas las variables de entorno estén correctas

### Problema: Errores de CSS/lightningcss
- Verifica que `NEXT_DISABLE_LIGHTNINGCSS=1` esté configurado
- Verifica que `optimizeCss: false` esté en `next.config.js`

---

## ✅ Checklist Final

Antes de hacer clic en "Create Web Service", verifica:

- [ ] Repositorio: `Fedeberonio/GDWeb`
- [ ] Branch: `test-build`
- [ ] Root Directory: `apps/web`
- [ ] Environment: `Docker`
- [ ] Dockerfile Path: `apps/web/Dockerfile`
- [ ] Docker Context: `../../`
- [ ] Variables de entorno configuradas (al menos `NODE_ENV` y `NEXT_DISABLE_LIGHTNINGCSS`)
- [ ] Health Check Path: `/api/health` (opcional)

---

## 🎉 ¡Listo!

Una vez que el deployment esté completo, tendrás tu aplicación funcionando en Render sin los problemas de exportación que tenías en Vercel.

**URL de tu aplicación:** `https://greendolio-web.onrender.com` (o el nombre que hayas elegido)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render Dashboard
2. Verifica que todas las configuraciones estén correctas
3. Consulta la documentación: https://render.com/docs

