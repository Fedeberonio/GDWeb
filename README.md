# Green Dolio Pro

Nueva base del proyecto Green Dolio con arquitectura moderna para ecommerce multilenguaje con catálogo de productos y pedidos personalizados.

## Estructura

```
GreenDolio-Pro/
├── apps/
│   ├── api/             # API Express + TypeScript, Firebase Admin
│   │   └── src/modules/  # Dominios (catálogo, usuarios, pedidos)
│   └── web/             # Frontend Next.js 14 + Tailwind + Firebase client
├── data/                # Insumos (Excel + JSON procesados)
└── package.json         # Workspaces npm
```

### Assets de marca

Los archivos pesados de diseño se movieron fuera del repositorio para mantenerlo liviano. Están en la carpeta
`../GreenDolio_BrandAssets`. El directorio `GreenDolio_BrandAssets/` que ves aquí solo contiene una nota de referencia.

> **Tip:** Cuando necesites usar un asset, cópialo desde `../GreenDolio_BrandAssets` hacia `apps/web/public/` o al destino
> correspondiente antes de ejecutar los scripts.

## Scripts principales

```bash
npm run dev:web   # Frontend en modo desarrollo
npm run dev:api   # API en modo desarrollo
npm run build     # Build de todos los paquetes
npm run lint      # Lint en todos los paquetes
npm --workspace apps/api run seed:catalog  # Semilla categorías y cajas en Firestore
npm --workspace apps/api run import:catalog [ruta_excel]  # Importa catálogo completo desde Excel
npm --workspace apps/api run images:sync  # Sincroniza imágenes locales con los productos en Firestore
```

## Panel administrativo

- `/admin` dashboard con métricas rápidas del catálogo.
- `/admin/products` y `/admin/boxes` para editar precios, textos e imágenes con formulario lateral/drawer y acciones rápidas (destacar/activar).
- `/admin/orders` listado inicial de pedidos con cambio de estado inline (usa `GET/PUT /api/admin/orders`).
- `/admin/history` timeline que consume `GET /api/admin/catalog/history?limit=n` para auditar quién modificó cada producto/caja y qué campos cambiaron.

## Variables de entorno

Copiar los ejemplos y completar con las credenciales reales de Firebase:

```
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

- `apps/web` usa los valores públicos de Firebase (`NEXT_PUBLIC_FIREBASE_*`) y la lista `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` para saber qué correos pueden acceder al panel. El token de Firebase de cada usuario se envía automáticamente en todas las llamadas admin.
- `apps/api` requiere las credenciales de servicio (Project ID, Client Email, Private Key), el bucket `FIREBASE_STORAGE_BUCKET` y la lista `ADMIN_ALLOWED_EMAILS` (correos autorizados) para validar peticiones administrativas.

## Próximos pasos

1. Completar variables de entorno y comprobar healthcheck del API (`/health`).
2. Importar el catálogo maestro con `npm --workspace apps/api run import:catalog` cada vez que se actualice el Excel.
3. Mantener la lista de correos permitidos sincronizada entre frontend y backend (`NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` y `ADMIN_ALLOWED_EMAILS`).
4. Configurar CI/CD y escenarios de despliegue (staging/producción) desde GitHub.
