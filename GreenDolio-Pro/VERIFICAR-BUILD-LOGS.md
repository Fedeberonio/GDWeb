# 🔍 Verificar Build Logs en Vercel

## Pasos para Verificar

### 1. Ir a los Build Logs
1. Ve a **Vercel → gd-web → Deployments**
2. Click en el deployment más reciente (el de `test-build` con commit `ff0efae`)
3. Click en la pestaña **"Logs"** o expande **"Build Logs"**

### 2. Buscar Estas Líneas

**✅ Si el build está correcto, deberías ver:**
```
Cloning github.com/Fedeberonio/GDWeb (Branch: test-build, Commit: ff0efae)
Installing dependencies...
Building: npm run build
Creating an optimized production build
Compiled successfully
Generating static pages
```

**❌ Si hay problemas, buscar:**
- Errores de "No framework detected"
- Errores de "Root Directory does not exist"
- Errores de build
- Mensajes sobre archivos estáticos

### 3. Verificar Root Directory

1. En el mismo deployment, expande **"Deployment Settings"**
2. Verifica que diga:
   - **Root Directory:** `GreenDolio-Pro/apps/web`
   - **Framework:** Next.js

### 4. Si Root Directory está mal

1. Ve a **Settings → General**
2. Busca **"Root Directory"**
3. Cámbialo a: `GreenDolio-Pro/apps/web`
4. Guarda
5. Haz un nuevo deployment

## Problema Posible

Si Vercel está detectando los archivos `index.html`, `main.css`, `script.js` de la raíz, puede estar sirviendo esos en lugar del proyecto Next.js.




