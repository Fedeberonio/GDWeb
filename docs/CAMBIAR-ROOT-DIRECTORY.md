# 🔧 Cambiar Root Directory en Vercel - PASO A PASO

## Pasos Exactos

### 1. En la página de Settings que estás viendo:
- En el menú lateral izquierdo, busca **"Build and Deployment"**
- Click en **"Build and Deployment"**

### 2. Buscar "Root Directory"
- En la página de "Build and Deployment", busca la sección **"Root Directory"**
- Actualmente puede estar vacío o decir algo diferente

### 3. Cambiar el Root Directory
- En el campo "Root Directory", escribe exactamente:
  ```
  GreenDolio-Pro/apps/web
  ```
- Click en **"Save"** o el botón de guardar

### 4. Verificar Framework
- En la misma página, verifica que:
  - **Framework Preset:** Next.js
  - Si no dice Next.js, cámbialo a Next.js

### 5. Guardar y Esperar
- Guarda todos los cambios
- Vercel creará automáticamente un nuevo deployment
- Espera 1-2 minutos

## Si no encuentras "Root Directory"

1. Busca en la misma página "Build and Development Settings"
2. O busca "Override" en la sección de build
3. El Root Directory puede estar en una sección expandible

## Verificación

Después de cambiar, el nuevo deployment debería:
- ✅ Construir desde `GreenDolio-Pro/apps/web`
- ✅ Detectar Next.js correctamente
- ✅ Mostrar la versión nueva










