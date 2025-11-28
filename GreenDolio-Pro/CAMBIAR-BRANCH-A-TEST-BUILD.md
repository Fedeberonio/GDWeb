# 🔧 CAMBIAR BRANCH A TEST-BUILD EN VERCEL

## 🚨 PROBLEMA CRÍTICO

Vercel está construyendo desde la rama `main` en lugar de `test-build`:
- **Error en logs:** `Cloning github.com/Fedeberonio/GDWeb (Branch: main, Commit: 4bde7de)`
- **Debería ser:** `Branch: test-build, Commit: 5251ebe`

---

## ✅ SOLUCIÓN: Cambiar Branch de Producción

### Paso 1: Ve a Settings
1. Ve a: https://vercel.com/gd-web/settings
2. Click en la pestaña **"Git"**

### Paso 2: Cambiar Production Branch
1. Busca la sección **"Production Branch"**
2. Actualmente debe decir: `main`
3. **Cámbialo a:** `test-build`
4. Click en **"Save"**

### Paso 3: Esperar Deployment
1. Vercel creará automáticamente un nuevo deployment desde `test-build`
2. Espera 2-3 minutos
3. El nuevo deployment debería pasar correctamente

---

## 🔍 Verificar

Después del cambio:
1. Ve a: https://vercel.com/gd-web/deployments
2. El nuevo deployment debería mostrar:
   - **Branch:** `test-build` ✅
   - **Commit:** `5251ebe` o más reciente ✅
   - **Estado:** Building o Ready ✅

---

## ⚠️ IMPORTANTE

También necesitas verificar que la variable de entorno esté configurada:

1. Ve a: Settings → Environment Variables
2. Busca: `NEXT_DISABLE_LIGHTNINGCSS`
3. Debe estar configurada como: `1` (para todas las environments)
4. Si no está, agrégala

---

**¡Haz esto AHORA y el build debería funcionar! 🚀**

