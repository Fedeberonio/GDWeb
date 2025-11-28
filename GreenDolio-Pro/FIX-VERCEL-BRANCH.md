# 🔧 Fix: Vercel está usando la rama incorrecta

## ❌ Problema Detectado

El deploy falló porque:
- Vercel está usando la rama `main` (no `test-build`)
- En `main` no existe `GreenDolio-Pro/apps/web`
- Solo existe en `test-build`

## ✅ Solución: Cambiar la rama en Vercel

### Paso 1: Ir a Settings del Proyecto
1. En Vercel, ve a tu proyecto `gd-web`
2. Click en **"Settings"** (arriba)
3. Click en **"Git"** (menú izquierdo)

### Paso 2: Cambiar la rama de producción
1. Busca la sección **"Production Branch"**
2. Cambia de `main` a `test-build`
3. Click en **"Save"**

### Paso 3: Crear nuevo deploy
1. Ve a la pestaña **"Deployments"**
2. Click en **"Redeploy"** en el último deployment
3. O crea un nuevo deployment manualmente

## 🔄 Alternativa: Crear Preview Deployment

Si quieres mantener `main` como producción y `test-build` como preview:

1. Ve a **Settings → Git**
2. En **"Preview Deployments"**, asegúrate de que esté habilitado
3. Haz un push a `test-build` (o crea un nuevo commit)
4. Vercel creará automáticamente un preview deployment de `test-build`

## 📋 Verificación

Después de cambiar la rama, verifica en los logs:
- Debe decir: `Branch: test-build` (no `main`)
- Debe encontrar: `GreenDolio-Pro/apps/web`
- El build debe completarse exitosamente

## 🚨 Nota Importante

Si cambias la rama de producción a `test-build`:
- Todos los futuros deploys usarán `test-build`
- Esto está bien para testing
- Cuando quieras producción real, cambia de vuelta a `main` o crea un proyecto separado




