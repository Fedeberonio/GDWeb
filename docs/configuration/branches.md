# Gestión de Branches y Git

## Branches Principales

### main
- **Propósito:** Branch de producción
- **Uso:** Solo para código que ha sido probado y aprobado
- **Deploy:** Automático a producción en Vercel

### test-build
- **Propósito:** Branch de staging/testing
- **Uso:** Desarrollo y testing antes de producción
- **Deploy:** Automático a staging en Vercel

## Flujo de Trabajo

### Desarrollo
1. Crear branch desde `test-build`
2. Hacer cambios
3. Commit y push
4. Testing en staging
5. Merge a `test-build` si es necesario

### Promoción a Producción
1. Verificar que `test-build` está estable
2. Merge `test-build` → `main`
3. Deploy automático a producción
4. Verificación post-deploy

## Configuración en Vercel

### Branches Configurados
- **Production Branch:** `main`
- **Preview Branches:** `test-build` y otras

### Cambiar Branch de Producción
1. Ir a Vercel Dashboard
2. Settings → Git
3. Cambiar "Production Branch"
4. Guardar cambios

## Notas

- Nunca hacer push directo a `main` sin testing
- Siempre probar en `test-build` primero
- Mantener branches sincronizados
