# 📋 INFORME TÉCNICO: Problema de Deployment en Vercel

**Fecha:** 27 de Noviembre, 2024  
**Proyecto:** GreenDolio-Pro (Next.js 14)  
**Repositorio:** `Fedeberonio/GDWeb`  
**Rama:** `test-build`  
**Plataforma:** Vercel (gd-web)

---

## 🎯 RESUMEN EJECUTIVO

**Problema Principal:** Todos los deployments en Vercel muestran la versión vieja de la aplicación (HTML estático) en lugar de la nueva versión Next.js, a pesar de que:
- ✅ El código nuevo está correctamente en Git (`test-build`)
- ✅ El build pasa localmente sin errores
- ✅ La aplicación funciona correctamente en desarrollo local (`npm run dev`)
- ✅ El Root Directory está configurado correctamente en Vercel

**Impacto:** La aplicación nueva (Next.js) no se puede desplegar en producción, bloqueando el lanzamiento.

---

## 📊 ESTADO ACTUAL DEL CÓDIGO

### Repositorio Git
- **Rama:** `test-build`
- **Último commit:** `0bd4e63` - "fix: agregar vercel.json para asegurar build correcto"
- **Commit anterior:** `ff0efae` - "fix: permitir que build continúe aunque fallen páginas de error en prerenderizado"
- **Ubicación del proyecto:** `GreenDolio-Pro/apps/web/`
- **Framework:** Next.js 14.2.15
- **Estado:** ✅ Código sincronizado con `origin/test-build`

### Estructura del Proyecto
```
GDWeb/
├── GreenDolio-Pro/
│   └── apps/
│       └── web/              ← Proyecto Next.js (NUEVO)
│           ├── src/
│           │   └── app/
│           │       ├── page.tsx
│           │       ├── layout.tsx
│           │       └── ...
│           ├── package.json
│           ├── next.config.js
│           └── vercel.json   ← Agregado recientemente
├── index.html                ← Versión VIEJA (HTML estático)
├── main.css                  ← Versión VIEJA
└── script.js                 ← Versión VIEJA
```

**Problema:** Los archivos `index.html`, `main.css`, `script.js` en la raíz del repositorio son de la versión vieja y pueden estar interfiriendo con el deployment.

---

## ⚙️ CONFIGURACIÓN DE VERCEL

### Project Settings (Correcto)
- **Project Name:** `gd-web`
- **Root Directory:** `GreenDolio-Pro/apps/web` ✅
- **Framework Preset:** Next.js ✅
- **Build Command:** `npm run build` (auto-detectado)
- **Output Directory:** `.next` (auto-detectado)

### Production Overrides (PROBLEMA)
- **Framework:** `Other` ❌ (debería ser `Next.js`)
- **Root Directory:** No se puede verificar (no se puede editar)
- **Estado:** Las overrides no se pueden modificar desde la UI

### Deployments
- **Production Current:** `6RHtrEVmc` - "Production Rebuild of ATEC43h4p" (30m ago)
- **Latest Preview:** `BfRpnjb29` - commit `0bd4e63` (9m ago) - Branch `test-build`
- **Todos los deployments muestran la versión vieja** al hacer click

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. Production Overrides con Framework Incorrecto
- **Síntoma:** Framework configurado como "Other" en lugar de "Next.js"
- **Impacto:** Vercel no detecta Next.js y puede estar sirviendo archivos estáticos
- **Estado:** No se puede editar desde la UI

### 2. Archivos Estáticos en la Raíz del Repo
- **Archivos:** `index.html`, `main.css`, `script.js` en la raíz
- **Problema:** Vercel puede estar detectando estos archivos y sirviéndolos en lugar del proyecto Next.js
- **Ubicación:** `GDWeb/index.html` (versión vieja)

### 3. Build Logs No Verificados
- **Estado:** No se han revisado los Build Logs del deployment de producción
- **Necesario:** Verificar si el build está fallando silenciosamente o si está construyendo correctamente pero sirviendo archivos incorrectos

### 4. Deployment de Producción Desactualizado
- **Production Current:** `6RHtrEVmc` es un "Production Rebuild" de un deployment viejo (`ATEC43h4p`)
- **Problema:** No está usando el deployment más reciente de `test-build` con los fixes

---

## 🛠️ INTENTOS DE SOLUCIÓN REALIZADOS

### ✅ Completados
1. **Fix del Build:** Modificado `package.json` para que el build continúe aunque fallen páginas de error
2. **vercel.json:** Agregado archivo `vercel.json` en `GreenDolio-Pro/apps/web/` para asegurar configuración
3. **Verificación de Git:** Confirmado que el código está correctamente en `origin/test-build`
4. **Root Directory:** Verificado que está configurado como `GreenDolio-Pro/apps/web`

### ❌ No Completados
1. **Cambiar Production Overrides:** No se puede editar desde la UI
2. **Promover Deployment:** Se intentó pero todos los deployments muestran la versión vieja
3. **Revisar Build Logs:** No se han revisado los logs del deployment de producción

---

## 🔬 DIAGNÓSTICO TÉCNICO

### Hipótesis Principal
Vercel está detectando los archivos estáticos (`index.html`, `main.css`, `script.js`) en la raíz del repositorio y los está sirviendo en lugar del proyecto Next.js, a pesar de que el Root Directory está configurado correctamente.

### Posibles Causas
1. **Production Overrides bloqueadas:** Las overrides tienen Framework="Other" y no se pueden cambiar
2. **Detección incorrecta de framework:** Vercel detecta los archivos HTML estáticos antes que el proyecto Next.js
3. **Build fallando silenciosamente:** El build puede estar fallando pero Vercel está sirviendo una versión cacheada vieja
4. **Configuración de output incorrecta:** El output directory puede estar apuntando a los archivos estáticos

### Evidencia
- ✅ Código correcto en Git
- ✅ Build funciona localmente
- ✅ Root Directory configurado correctamente
- ❌ Todos los deployments muestran versión vieja
- ❌ Production Overrides no editables
- ❌ Framework="Other" en producción

---

## 📝 RECOMENDACIONES PARA EL INGENIERO

### Acciones Inmediatas

1. **Revisar Build Logs del Deployment de Producción**
   - Ir a Vercel → Deployments → `6RHtrEVmc` → Logs
   - Verificar si el build está fallando o completándose correctamente
   - Buscar errores relacionados con Next.js o detección de framework

2. **Eliminar o Mover Archivos Estáticos de la Raíz**
   - Opción A: Mover `index.html`, `main.css`, `script.js` a una carpeta `legacy/` o `old-version/`
   - Opción B: Agregar estos archivos a `.vercelignore` o `.gitignore` si no se necesitan
   - **Nota:** Estos archivos pueden ser necesarios para GitHub Pages, verificar antes de eliminar

3. **Forzar Nuevo Deployment de Producción**
   - Eliminar las Production Overrides mediante API de Vercel o CLI
   - O crear un nuevo proyecto en Vercel apuntando a `test-build`
   - O usar Vercel CLI para hacer deploy directamente: `vercel --prod`

4. **Verificar Configuración de Output**
   - Asegurar que el output directory sea `.next` (Next.js default)
   - Verificar que no haya configuraciones que apunten a la raíz del repo

5. **Usar Vercel CLI para Deployment**
   ```bash
   cd GreenDolio-Pro/apps/web
   vercel --prod --yes
   ```
   Esto puede bypassear las configuraciones problemáticas

### Investigación Adicional

1. **Revisar Variables de Entorno**
   - Verificar que todas las variables de entorno estén configuradas correctamente
   - Especialmente `NEXT_PUBLIC_*` variables

2. **Verificar Configuración de Next.js**
   - Revisar `next.config.js` para asegurar que no haya configuraciones que interfieran
   - Verificar `vercel.json` recién agregado

3. **Revisar Deployment Protection**
   - Verificar si hay protección de deployment activada que esté bloqueando cambios

4. **Comparar Build Local vs Vercel**
   - Ejecutar `npm run build` localmente y comparar output con logs de Vercel
   - Verificar que los archivos generados sean los mismos

### Soluciones Alternativas

1. **Crear Nuevo Proyecto en Vercel**
   - Crear un proyecto nuevo apuntando a `test-build`
   - Esto evitará las Production Overrides problemáticas

2. **Usar Subdirectorio Diferente**
   - Mover el proyecto Next.js a una ubicación diferente temporalmente
   - O crear una rama nueva sin los archivos estáticos en la raíz

3. **Contactar Soporte de Vercel**
   - Si las Production Overrides están bloqueadas, puede ser un bug de Vercel
   - Solicitar que eliminen las overrides manualmente

---

## 📎 ARCHIVOS RELEVANTES

### Configuración
- `GreenDolio-Pro/apps/web/package.json` - Scripts de build modificados
- `GreenDolio-Pro/apps/web/next.config.js` - Configuración de Next.js
- `GreenDolio-Pro/apps/web/vercel.json` - Configuración de Vercel (recién agregado)

### Código Principal
- `GreenDolio-Pro/apps/web/src/app/page.tsx` - Página principal Next.js
- `GreenDolio-Pro/apps/web/src/app/layout.tsx` - Layout principal

### Archivos Problemáticos (Raíz)
- `index.html` - Versión vieja (HTML estático)
- `main.css` - Versión vieja
- `script.js` - Versión vieja

---

## 🔗 ENLACES ÚTILES

- **Repositorio:** https://github.com/Fedeberonio/GDWeb (rama `test-build`)
- **Vercel Project:** https://vercel.com/gd-web
- **Deployments:** https://vercel.com/gd-web/deployments
- **Settings:** https://vercel.com/gd-web/settings

---

## 📞 INFORMACIÓN DE CONTACTO

**Desarrollador:** [Tu nombre]  
**Email:** [Tu email]  
**Fecha del Problema:** 27 de Noviembre, 2024  
**Tiempo Invertido:** ~2 horas de troubleshooting

---

## ✅ CHECKLIST PARA EL INGENIERO

- [ ] Revisar Build Logs del deployment de producción
- [ ] Verificar si los archivos estáticos en la raíz están interfiriendo
- [ ] Intentar eliminar Production Overrides mediante API/CLI
- [ ] Probar deployment con Vercel CLI directamente
- [ ] Verificar configuración de output directory
- [ ] Comparar build local vs Vercel
- [ ] Considerar crear nuevo proyecto en Vercel si es necesario
- [ ] Contactar soporte de Vercel si las overrides están bloqueadas

---

**Fin del Informe**




