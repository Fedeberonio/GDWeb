# Guía de Deployment - GreenDolio Pro

Esta sección contiene toda la documentación relacionada con el deployment de la aplicación.

## Índice

- [Deployment en Vercel](./vercel.md) - Guía completa para deploy en Vercel
- [Deployment en Render](./render.md) - Guía para deploy en Render (si aplica)
- [Deployment en Netlify](./netlify.md) - Guía para deploy en Netlify (si aplica)
- [Promoción a Producción](./promocion.md) - Proceso para promover deployments a producción

## Información General

### Cuenta y Credenciales

**Cuenta Vercel:** greendolioexpress@gmail.com
- **Team:** GD's projects (gds-projects-1bbb6204)
- **Token:** (verificar en configuración segura)

### Estructura del Proyecto

- **Frontend:** `apps/web/` (Next.js 14)
- **Backend:** `apps/api/` (Express + TypeScript)
- **Root Directory en Vercel:** `apps/web`

## Quick Start

### Deploy Rápido en Vercel

```bash
cd apps/web
vercel --prod
```

### Verificar Deployment

```bash
vercel ls
```

## Documentación Detallada

Para información detallada sobre cada plataforma, consulta los archivos específicos en este directorio.
