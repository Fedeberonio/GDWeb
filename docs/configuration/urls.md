# URLs y Endpoints

## URLs de Aplicación

### Frontend
- **Staging:** (configurar en Vercel Dashboard)
- **Producción:** (configurar después de promoción)

### Backend API
- **Staging:** (configurar en Render o similar)
- **Producción:** (configurar después de promoción)

## Endpoints Principales

### API Pública
- `GET /api/catalog/products` - Lista de productos
- `GET /api/catalog/boxes` - Lista de cajas
- `GET /api/catalog/categories` - Lista de categorías
- `POST /api/orders` - Crear pedido

### API Administrativa
- `GET /api/admin/catalog/products` - Gestión de productos
- `GET /api/admin/orders` - Gestión de pedidos
- `GET /api/admin/box-builder/requests` - Solicitudes de builder

## Configuración

Las URLs se configuran en:
- **Vercel:** Settings → Domains
- **Variables de entorno:** `NEXT_PUBLIC_API_BASE_URL`

## Notas

- Verificar que las URLs estén correctamente configuradas en cada ambiente
- Las URLs de staging y producción deben estar separadas
- Mantener documentación actualizada cuando cambien las URLs
