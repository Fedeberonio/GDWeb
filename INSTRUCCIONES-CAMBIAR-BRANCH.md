# 🎯 INSTRUCCIONES EXACTAS: Cambiar Branch a test-build

## ✅ Página Abierta

He abierto la página en tu navegador:
**https://vercel.com/gd-web/settings/git**

---

## 📋 PASOS EXACTOS (2 minutos):

### 1. En la página que se abrió, busca:
   - Sección: **"Production Branch"**
   - Actualmente dice: `main`

### 2. Cambia el valor:
   - Click en el dropdown o campo de texto
   - Escribe o selecciona: `test-build`
   - O cambia de `main` a `test-build`

### 3. Guarda:
   - Click en el botón **"Save"** o **"Update"**
   - Confirma si te pide confirmación

### 4. Espera:
   - Vercel creará automáticamente un nuevo deployment
   - Espera 2-3 minutos
   - Ve a Deployments para ver el progreso

---

## 🔍 Verificar que Funcionó

1. Ve a: https://vercel.com/gd-web/deployments
2. El nuevo deployment debería mostrar:
   - ✅ **Branch:** `test-build`
   - ✅ **Commit:** `2901dc7` o más reciente
   - ✅ **Estado:** Building → Ready

---

## ⚠️ También Verifica Variable de Entorno

Mientras estás en Settings:

1. Ve a: **Environment Variables** (en el menú lateral)
2. Busca: `NEXT_DISABLE_LIGHTNINGCSS`
3. Debe estar configurada como: `1`
4. Si no está, agrégala:
   - Key: `NEXT_DISABLE_LIGHTNINGCSS`
   - Value: `1`
   - Environments: All (Production, Preview, Development)

---

**¡Hazlo ahora y el build funcionará! 🚀**







