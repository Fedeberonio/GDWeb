# 🔧 Cambiar Branch de Producción en Vercel

## El Problema
- ✅ Git está correcto: `GreenDolio-Pro` está en `test-build`
- ✅ El código nuevo está en GitHub
- ❌ Vercel está usando `main` (versión vieja) para producción

## Solución: Cambiar Branch en Vercel

### Paso 1: Ir a Settings de Vercel
1. Ve a **Vercel.com**
2. Selecciona el proyecto **"gd-web"**
3. Click en **"Settings"** (en el menú lateral)

### Paso 2: Ir a Git Settings
1. En Settings, busca la pestaña **"Git"**
2. Click en **"Git"**

### Paso 3: Cambiar Production Branch
1. Busca la sección **"Production Branch"**
2. Actualmente debe decir: `main`
3. **Cámbialo a:** `test-build`
4. Click en **"Save"** o **"Update"**

### Paso 4: Esperar Deployment
1. Vercel creará automáticamente un nuevo deployment
2. Espera 1-2 minutos
3. La URL de producción mostrará la versión nueva

## Verificación

Después del cambio:
- ✅ La URL de producción mostrará la app nueva
- ✅ El deployment usará la rama `test-build`
- ✅ Verás el commit `ff0efae` en producción

## Nota sobre "ailantica-ARCH"

GitHub muestra "ailantica-ARCH" porque el email `ai.lantica@lanticastudios.com` está asociado a esa cuenta. Esto es solo cosmético - el código está correcto.




