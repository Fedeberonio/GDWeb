# 🚀 Promover Deployment a Producción

## Si no puedes cambiar Production Overrides

La solución es **promover el deployment correcto** a producción. Esto creará un nuevo deployment con las configuraciones correctas.

## Pasos

### 1. Ir a Deployments
1. En Vercel, click en **"Deployments"** (en el menú superior)
2. O ve directamente a: `vercel.com/gd-web/deployments`

### 2. Buscar el Deployment Correcto
Busca el deployment que tenga:
- **Branch:** `test-build`
- **Commit:** `0bd4e63` o `ff0efae` (los más recientes)
- **Estado:** Ready Latest (Preview)
- **Framework:** Debería detectar Next.js correctamente

### 3. Promover a Producción
1. Click en ese deployment para abrirlo
2. Busca los **"..."** (tres puntos) en la esquina superior derecha
3. O busca un botón que diga **"Promote"** o **"Promote to Production"**
4. Click en esa opción
5. Confirma

### 4. Esperar
1. Espera 1-2 minutos
2. El nuevo deployment de producción tendrá las configuraciones correctas
3. La URL de producción mostrará la versión nueva

## Alternativa: Eliminar Production Overrides

Si hay un botón para eliminar/resetear las overrides:
1. Busca un botón que diga **"Reset"**, **"Clear Overrides"**, o **"Use Project Settings"**
2. Click en ese botón
3. Esto eliminará las overrides y usará las configuraciones del proyecto




