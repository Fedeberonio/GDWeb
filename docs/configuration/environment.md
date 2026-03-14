# Configuración de Entorno

## Variables de Entorno

### Frontend (apps/web)

#### Firebase
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=greendolio-tienda.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=greendolio-tienda
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=greendolio-tienda.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

#### API
```
NEXT_PUBLIC_API_BASE_URL=https://tu-backend.onrender.com/api
```

#### Admin
```
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=tu-email@ejemplo.com
```

### Backend (apps/api)

#### Firebase Admin
```
FIREBASE_PROJECT_ID=greendolio-tienda
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

#### Servidor
```
PORT=3000
NODE_ENV=production
```

## Configuración por Ambiente

### Desarrollo Local
- Usar archivos `.env.local`
- No commitear archivos `.env.local`

### Staging
- Configurar en Vercel Dashboard
- Usar variables de entorno de Vercel

### Producción
- Configurar en Vercel Dashboard
- Usar variables de entorno de producción
- Verificar que todas las variables estén configuradas

## Seguridad

- **Nunca** commitear credenciales en el código
- Usar variables de entorno para todos los secretos
- Rotar credenciales periódicamente
- Verificar permisos de acceso

## Notas

- Las variables `NEXT_PUBLIC_*` son accesibles en el cliente
- Las variables sin `NEXT_PUBLIC_` son solo del servidor
- Verificar que todas las variables estén configuradas antes de deploy
