# 🚀 Guía de Deployment en Render

## 📋 Prerrequisitos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio en GitHub con el código
3. Variables de entorno configuradas

## 🔧 Pasos para Deployar

### Opción 1: Usando Render Dashboard (Recomendado)

1. **Crear nuevo Web Service**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub

2. **Configurar el servicio**
   - **Name:** `greendolio-web`
   - **Region:** Elige la región más cercana (US East recomendado)
   - **Branch:** `test-build`
   - **Root Directory:** `apps/web`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `apps/web/Dockerfile`
   - **Docker Context:** `../../` (raíz del proyecto)

3. **Configurar Variables de Entorno**
   ```
   NODE_ENV=production
   NEXT_DISABLE_LIGHTNINGCSS=1
   NEXT_PUBLIC_API_BASE_URL=https://tu-api-url.com
   FIREBASE_API_KEY=tu-api-key
   FIREBASE_AUTH_DOMAIN=tu-auth-domain
   FIREBASE_PROJECT_ID=tu-project-id
   FIREBASE_STORAGE_BUCKET=tu-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
   FIREBASE_APP_ID=tu-app-id
   ```

4. **Configurar Health Check**
   - **Health Check Path:** `/api/health`

5. **Deploy**
   - Click en "Create Web Service"
   - Render construirá la imagen Docker y desplegará la aplicación

### Opción 2: Usando render.yaml (Blueprints)

1. **Push del archivo render.yaml**
   - El archivo `apps/web/render.yaml` ya está configurado
   - Haz push al repositorio

2. **Crear Blueprint**
   - Ve a Render Dashboard
   - Click en "New +" → "Blueprint"
   - Selecciona tu repositorio
   - Render detectará automáticamente el `render.yaml`

3. **Aplicar Blueprint**
   - Render creará el servicio automáticamente
   - Solo necesitas configurar las variables de entorno

## 🔍 Verificar el Deployment

1. **Revisar Logs**
   - Ve a la sección "Logs" del servicio
   - Verifica que el build se complete exitosamente
   - Busca: "Build completed successfully"

2. **Probar la aplicación**
   - Render te dará una URL: `https://greendolio-web.onrender.com`
   - Visita la URL y verifica que la aplicación funcione

3. **Health Check**
   - Verifica: `https://tu-url.onrender.com/api/health`
   - Debe retornar `{"status":"ok"}`

## 🐛 Troubleshooting

### Problema: Build falla
- Verifica que el Dockerfile esté correcto
- Revisa los logs de build en Render
- Asegúrate de que todas las variables de entorno estén configuradas

### Problema: Aplicación no inicia
- Verifica que el puerto esté configurado correctamente (3000)
- Revisa los logs de runtime
- Verifica que las variables de entorno estén correctas

### Problema: Errores de CSS
- Asegúrate de que `NEXT_DISABLE_LIGHTNINGCSS=1` esté configurado
- Verifica que `optimizeCss: false` esté en `next.config.js`

## 📊 Ventajas de Render sobre Vercel

1. ✅ **Control total sobre el build**: Docker nos da control completo
2. ✅ **No detecta errores de exportación**: Render no bloquea por errores de prerenderizado
3. ✅ **Más flexible**: Podemos configurar exactamente lo que necesitamos
4. ✅ **Logs más detallados**: Mejor visibilidad de lo que está pasando
5. ✅ **Health checks**: Mejor monitoreo de la aplicación

## 💰 Costos

- **Free Tier**: 750 horas/mes (suficiente para desarrollo/testing)
- **Starter Plan**: $7/mes (sin límite de horas, mejor para producción)

## 🔗 Enlaces Útiles

- [Render Documentation](https://render.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)




