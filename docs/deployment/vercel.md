# Deployment en Vercel

## Configuración Inicial

### Cuenta y Credenciales

- **Cuenta:** greendolioexpress@gmail.com
- **Team:** GD's projects (gds-projects-1bbb6204)
- **Token:** (configurar en variables de entorno seguras)

### Configuración del Proyecto

1. **Framework Preset:** Next.js
2. **Root Directory:** `apps/web`
3. **Build Command:** `npm run build`
4. **Output Directory:** `.next`
5. **Install Command:** `npm install`
6. **Development Command:** `npm run dev`

### Branch para Deploy

- **Staging:** `test-build`
- **Producción:** `main` (después de promoción)

## Variables de Entorno

### Frontend (apps/web)

```
NEXT_PUBLIC_API_BASE_URL=https://tu-backend.onrender.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=tu-email@ejemplo.com
```

### Backend (apps/api)

```
FIREBASE_PROJECT_ID=greendolio-tienda
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
PORT=3000
```

## Proceso de Deploy

### 1. Preparar Código

```bash
# Asegurarse de estar en la rama correcta
git checkout test-build

# Verificar que no hay errores
cd apps/web
npm run build
```

### 2. Deploy Manual

```bash
cd apps/web
vercel --prod
```

### 3. Deploy Automático

El deploy automático se activa al hacer push a la rama configurada en Vercel.

## Solución de Problemas

### Error de Build

1. Verificar logs en Vercel Dashboard
2. Revisar variables de entorno
3. Verificar que el root directory sea `apps/web`

### Error de Branch

1. Verificar que la rama esté configurada en Vercel
2. Verificar permisos de la rama
3. Revisar configuración de Git

### Error de Variables de Entorno

1. Verificar que todas las variables estén configuradas
2. Verificar que no haya espacios en los valores
3. Verificar formato de las variables

## URLs

- **Staging:** (configurar en Vercel)
- **Producción:** (configurar después de promoción)

## Documentación Histórica

Para referencias históricas y documentación antigua, consulta `historico/` en este directorio.
