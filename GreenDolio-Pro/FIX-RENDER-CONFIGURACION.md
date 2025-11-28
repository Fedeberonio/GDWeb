# 🔧 Fix: Configuración de Render para Dockerfile en Raíz

## 🔴 Problema Actual

El error en Render:
```
error: invalid local: resolve : lstat /opt/render/project/src/apps: no such file or directory
```

**Causa:** Render está configurado con `Root Directory = apps/web`, pero el Dockerfile necesita acceso a la raíz del proyecto.

## ✅ Solución Aplicada

1. ✅ Creado `Dockerfile` en la raíz del proyecto (`/Dockerfile`)
2. ✅ Cambios pusheados al branch `test-build` (commit `265fc88`)

## 📋 Cambios Necesarios en Render Dashboard

### Paso 1: Ir a Settings
1. Ve a: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0/settings
2. O desde el dashboard, haz clic en el servicio "GDWeb" → "Settings"

### Paso 2: Buscar Sección "Build & Deploy"
- Busca la sección **"Build & Deploy"** o **"Build Settings"**
- Puede estar en una pestaña o sección expandible

### Paso 3: Cambiar Configuración

**CAMBIOS REQUERIDOS:**

1. **Root Directory:**
   - **ANTES:** `apps/web`
   - **DESPUÉS:** ` ` (DEJAR VACÍO) o `.` (punto)

2. **Dockerfile Path:**
   - **ANTES:** `apps/web/Dockerfile` (o lo que esté configurado)
   - **DESPUÉS:** `Dockerfile`

3. **Docker Context:**
   - **ANTES:** `../../` (o lo que esté configurado)
   - **DESPUÉS:** `.` (punto)

### Paso 4: Guardar Cambios
- Haz clic en **"Save Changes"** o el botón de guardar
- Render puede mostrar una advertencia sobre cambios - confirma

### Paso 5: Hacer Manual Deploy
1. Ve a la página principal del servicio: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0
2. Haz clic en el botón **"Manual Deploy"** (arriba a la derecha)
3. Selecciona el branch `test-build`
4. Haz clic en **"Deploy latest commit"**

## 📊 Resumen de Configuración Correcta

```
Root Directory:     (vacío)
Dockerfile Path:    Dockerfile
Docker Context:     .
Branch:             test-build
Environment:        Docker
```

## ✅ Verificación

Después del deploy, verifica en los logs:
- ✅ Debe aparecer: "Cloning from https://github.com/Fedeberonio/GDWeb"
- ✅ Debe aparecer: "Checking out commit..." (del commit más reciente)
- ✅ NO debe aparecer el error: "lstat /opt/render/project/src/apps"

## 🐛 Si Sigue Fallando

Si después de estos cambios sigue fallando:

1. Verifica que el Dockerfile esté en la raíz del repositorio
2. Verifica que el commit `265fc88` esté en el branch `test-build`
3. Revisa los logs completos del build para ver el error específico
4. Contacta soporte de Render si es necesario

## 🔗 Enlaces Útiles

- Dashboard del servicio: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0
- Settings: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0/settings
- Logs: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0/logs

