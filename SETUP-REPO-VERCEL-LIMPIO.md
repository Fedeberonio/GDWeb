# 🚀 Setup Completo - Repositorio y Vercel Limpio

## Objetivo
Crear un entorno completamente separado de la producción para pruebas:
- **Cuenta GitHub:** greendolioexpress@gmail.com
- **Cuenta Vercel:** greendolioexpress@gmail.com
- **Separado de:** Fedeberonio/GDWeb (producción en www.greendolio.shop)

---

## Paso 1: Crear Repositorio en GitHub

### 1.1. Ir a GitHub
1. Ve a: https://github.com
2. Asegúrate de estar logueado con **greendolioexpress@gmail.com**
3. Click en el botón **"+"** (arriba a la derecha) → **"New repository"**

### 1.2. Configurar el Repositorio
- **Repository name:** `greendolio-test` (o el nombre que prefieras)
- **Description:** "Green Dolio - Entorno de Pruebas"
- **Visibility:** 
  - ✅ **Private** (recomendado para pruebas)
  - O **Public** si prefieres
- **NO marques:**
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license
- Click en **"Create repository"**

### 1.3. Copiar la URL del Repositorio
GitHub te mostrará una página con instrucciones. **Copia la URL** que aparece, será algo como:
```
https://github.com/greendolioexpress/greendolio-test.git
```

---

## Paso 2: Conectar el Repositorio Local

Una vez que tengas la URL del nuevo repositorio, ejecuta estos comandos:

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"

# Cambiar el remote al nuevo repositorio
git remote set-url origin https://github.com/greendolioexpress/greendolio-test.git

# Verificar que cambió
git remote -v

# Hacer push de la rama test-build
git push -u origin test-build

# También push de main si quieres
git checkout main
git push -u origin main
```

**Nota:** Si pide credenciales, usa el token de GitHub que tienes.

---

## Paso 3: Conectar Vercel con el Nuevo Repositorio

### 3.1. Ir a Vercel
1. Ve a: https://vercel.com
2. Asegúrate de estar logueado con **greendolioexpress@gmail.com**
3. Click en **"Add New..."** → **"Project"**

### 3.2. Importar el Repositorio
1. En la sección **"Import Git Repository"**, busca tu nuevo repositorio: `greendolioexpress/greendolio-test`
2. Si no aparece, click en **"Adjust GitHub App Permissions"** y autoriza el acceso
3. Click en **"Import"** al lado del repositorio

### 3.3. Configuración del Proyecto
En la pantalla de configuración:

- **Project Name:** `greendolio-test` (o el que prefieras)
- **Framework Preset:** `Next.js` (debería detectarlo automáticamente)
- **Root Directory:** ⚠️ **`apps/web`** (MUY IMPORTANTE)
- **Build Command:** `npm run build` (por defecto)
- **Output Directory:** `.next` (por defecto)
- **Install Command:** `npm install` (por defecto)

### 3.4. Branch para Deploy
- **Production Branch:** `main` (o `test-build` si prefieres)
- Para previews, Vercel automáticamente creará deployments de otras ramas

### 3.5. Variables de Entorno
**NO hagas deploy todavía.** Primero configura las variables:

Click en **"Environment Variables"** y agrega estas variables (una por una):

```
NEXT_PUBLIC_API_BASE_URL
Valor: http://localhost:5001/api
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_API_KEY
Valor: [Del archivo apps/web/.env.local]
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Valor: greendolio-tienda.firebaseapp.com
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_PROJECT_ID
Valor: greendolio-tienda
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Valor: greendolio-tienda.appspot.com
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Valor: 64271997064
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_APP_ID
Valor: 1:64271997064:web:8001973cad419458fd379f
Ambientes: Production, Preview, Development

NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
Valor: G-H9F4SXPJPA
Ambientes: Production, Preview, Development
(Opcional)

NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS
Valor: greendolioexpress@gmail.com
Ambientes: Production, Preview, Development
(Opcional)
```

**Para obtener los valores reales de Firebase:**
- Abre el archivo: `apps/web/.env.local`
- Copia los valores de cada variable

### 3.6. Hacer el Deploy
1. Después de agregar todas las variables, click en **"Deploy"**
2. Espera a que termine el build (2-3 minutos)
3. Una vez completado, tendrás una URL como: `https://greendolio-test.vercel.app`

---

## Paso 4: Verificar el Deploy

1. Ve a la URL que Vercel te proporcionó
2. La aplicación debería cargar correctamente
3. Prueba las funcionalidades principales

---

## ✅ Resultado Final

- ✅ Repositorio limpio en GitHub: `greendolioexpress/greendolio-test`
- ✅ Proyecto en Vercel: `greendolio-test`
- ✅ Completamente separado de la producción
- ✅ Listo para pruebas sin afectar www.greendolio.shop

---

## 🔄 Para Futuros Cambios

Cada vez que hagas cambios:
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"
git add .
git commit -m "Descripción del cambio"
git push origin test-build
```

Vercel automáticamente creará un nuevo deployment preview.
