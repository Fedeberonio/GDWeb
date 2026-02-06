# Variables de entorno en Vercel (web)

Para que el deploy en Vercel cargue bien y no muestre *"Application error: a server-side exception"*, hay que configurar **todas** estas variables en el proyecto de Vercel.

**Dónde:** Vercel → tu proyecto → **Settings** → **Environment Variables**.

## Obligatorias (si falta una, el servidor puede fallar)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | URL base de la API (ej: `https://tu-api.vercel.app/api` o `https://api.greendolio.com/api`). Debe ser URL válida. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase (Consola Firebase → Configuración del proyecto). |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (ej: `tu-proyecto.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto en Firebase. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket (ej: `tu-proyecto.appspot.com`). |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de Firebase. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase. |

## Opcionales

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics (opcional). |
| `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` | Emails permitidos para admin, separados por coma. Si no se define, se usa `greendolioexpress@gmail.com`. |

## Cómo rellenarlas

Copia los valores de tu `apps/web/.env.local` (o del archivo que uses en local) y pégalos en Vercel para **Production**, **Preview** y **Development** según quieras que apliquen.

Después de guardar, haz un **nuevo deploy** (Redeploy) para que las variables se apliquen.
