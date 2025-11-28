# 🚀 Guía de Deployment en Netlify

## 📋 Prerrequisitos

1. Cuenta en [Netlify](https://netlify.com)
2. Repositorio en GitHub con el código
3. Variables de entorno configuradas

## 🔧 Pasos para Deployar

### Opción 1: Usando Netlify Dashboard

1. **Crear nuevo Site**
   - Ve a [Netlify Dashboard](https://app.netlify.com)
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio de GitHub

2. **Configurar el build**
   - **Base directory:** `apps/web`
   - **Build command:** `docker build -f apps/web/Dockerfile -t greendolio-web . && docker run --rm -p 3000:3000 greendolio-web`
   - **Publish directory:** `.next` (pero con Docker, esto no aplica)

   **NOTA:** Netlify tiene soporte limitado para Docker. Mejor usar Render o Railway.

### Opción 2: Usando Railway (Recomendado para Docker)

Railway es mejor opción que Netlify para aplicaciones Docker.

1. **Crear cuenta en Railway**
   - Ve a [Railway.app](https://railway.app)
   - Conecta tu cuenta de GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Configurar el servicio**
   - Railway detectará automáticamente el Dockerfile
   - Configura las variables de entorno
   - Railway construirá y desplegará automáticamente

4. **Variables de entorno**
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
   PORT=3000
   ```

## 🎯 Recomendación

**Para aplicaciones Docker, Render o Railway son mejores opciones que Netlify.**

Netlify está optimizado para aplicaciones estáticas o serverless functions, mientras que Render y Railway están diseñados para aplicaciones Docker y contenedores.

## 🔗 Enlaces Útiles

- [Railway Documentation](https://docs.railway.app)
- [Render vs Railway Comparison](https://render.com/docs/comparing-render)

