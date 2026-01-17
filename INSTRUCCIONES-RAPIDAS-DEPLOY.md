# 🚀 Instrucciones Rápidas - Deploy Completo

## ✅ Lo que ya está hecho:
- ✅ Código preparado y commiteado
- ✅ Scripts automatizados creados
- ✅ Aplicación corriendo en local (http://localhost:3000)

## 📋 Pasos Restantes (Requieren tu intervención):

### Paso 1: Crear Repositorio en GitHub (2 minutos)

1. Ve a: https://github.com/new
2. Asegúrate de estar logueado con **greendolioexpress@gmail.com**
3. **Repository name:** `greendolio-test`
4. **Description:** "Green Dolio - Entorno de Pruebas"
5. **Visibility:** ✅ **Private**
6. ❌ NO marques README, .gitignore, ni license
7. Click en **"Create repository"**
8. **Copia la URL** que aparece (ej: `https://github.com/greendolioexpress/greendolio-test.git`)

---

### Paso 2: Autenticarse en Vercel (1 minuto)

1. Abre terminal y ejecuta:
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
vercel logout
vercel login
```

2. Cuando te pida, selecciona:
   - **Login method:** Email
   - **Email:** greendolioexpress@gmail.com
   - Sigue las instrucciones para autenticarte

---

### Paso 3: Ejecutar Script Automatizado (5 minutos)

Una vez que tengas:
- ✅ Repositorio creado en GitHub (con la URL)
- ✅ Autenticado en Vercel con greendolioexpress@gmail.com

Ejecuta el script:

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"
./deploy-completo.sh
```

El script te guiará paso a paso y:
- ✅ Configurará el remote de Git
- ✅ Hará push del código
- ✅ Configurará las variables de entorno en Vercel (si tienes .env.local)
- ✅ Hará el deploy

---

## 🔄 Alternativa Manual (Si prefieres hacerlo paso a paso)

### 2.1. Configurar Git Remote
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"
git remote set-url origin https://github.com/greendolioexpress/greendolio-test.git
git push -u origin test-build
```

### 2.2. Conectar Vercel con GitHub
1. Ve a: https://vercel.com
2. Click en **"Add New..."** → **"Project"**
3. Importa: `greendolioexpress/greendolio-test`
4. **Root Directory:** `apps/web`
5. **Framework:** Next.js
6. Click en **"Deploy"**

### 2.3. Configurar Variables de Entorno
1. Ve a: Settings → Environment Variables
2. Agrega las variables de `apps/web/.env.local`
3. Selecciona: Production, Preview, Development
4. Guarda

### 2.4. Redeploy
1. Ve a: Deployments
2. Click en los tres puntos (⋯) del último deployment
3. Click en **"Redeploy"**

---

## ✅ Verificación Final

Una vez completado, deberías tener:
- ✅ Repositorio: `greendolioexpress/greendolio-test`
- ✅ Vercel: Proyecto desplegado y funcionando
- ✅ URL: `https://greendolio-test.vercel.app` (o similar)
- ✅ Completamente separado de la producción

---

## 🆘 Si algo falla

1. **Error de autenticación en GitHub:**
   - Verifica que el token tenga permisos `repo`
   - O usa autenticación por SSH

2. **Error en Vercel:**
   - Verifica que estés autenticado con la cuenta correcta
   - Revisa los logs: `vercel logs [deployment-url]`

3. **Variables de entorno faltantes:**
   - Asegúrate de agregar todas las variables de `apps/web/.env.local`
   - Verifica que estén en los 3 ambientes (Production, Preview, Development)
