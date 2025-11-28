# ⚠️ Sincronizar Configuración de Producción

## Problema Detectado

Hay un warning que dice:
**"Configuration Settings in the current Production deployment differ from your current Project Settings."**

Esto significa que el deployment de producción tiene configuraciones viejas diferentes a las del proyecto.

## Solución

### Opción 1: Expandir "Production Overrides" (Recomendado)

1. **En la página que estás viendo, busca la sección "Framework Settings"**
2. **Expande "Production Overrides"** (debería tener un link a `gd-9hlaxnOpz-ayudames-projects.vercel.app`)
3. **Verifica qué dice en "Root Directory" ahí**
4. Si dice algo diferente a `GreenDolio-Pro/apps/web`, cámbialo
5. **Guarda los cambios**

### Opción 2: Sincronizar con Project Settings

1. En la misma sección, busca un botón que diga **"Use Project Settings"** o **"Sync with Project Settings"**
2. Click en ese botón
3. Esto sincronizará el deployment de producción con las configuraciones del proyecto

### Opción 3: Hacer un Nuevo Deployment

1. Ve a **Deployments**
2. Busca el deployment de `test-build` con commit `0bd4e63` (el más reciente)
3. Click en los "..." → **"Promote to Production"**
4. Esto creará un nuevo deployment de producción con las configuraciones correctas

## Verificación

Después de sincronizar, el warning debería desaparecer y la app nueva debería aparecer en producción.




