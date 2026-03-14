# 🔗 URLs para Probar la Página Online

**Última actualización:** 28 de Noviembre, 2024  
**Último commit:** `5251ebe` - "fix: mejorar páginas de error para evitar styled-jsx"

---

## 🚀 URL Principal para Probar (Preview - Versión Nueva)

### URL de Preview (test-build branch)
```
https://gd-web-git-test-build-ayudames-projects.vercel.app
```

**Esta es la URL que debes usar para probar la versión nueva.**

---

## 📋 Cómo Acceder a las URLs

### Opción 1: Desde Vercel Dashboard
1. Ve a: https://vercel.com/gd-web/deployments
2. Busca el deployment más reciente con:
   - **Branch:** `test-build`
   - **Commit:** `5251ebe` o más reciente
   - **Estado:** Ready ✅
3. Click en el deployment
4. Click en el botón **"Visit"** o copia la URL de "Domains"

### Opción 2: URL Directa de Preview
```
https://gd-web-git-test-build-ayudames-projects.vercel.app
```

### Opción 3: URL de Producción (si está actualizada)
```
https://gd-web-theta.vercel.app
```
⚠️ **Nota:** Esta puede mostrar la versión vieja si no se ha promovido el deployment de `test-build`.

---

## ✅ Qué Probar

### 1. Página Principal
- [ ] La página carga correctamente
- [ ] Diseño moderno de Next.js (no la versión vieja HTML)
- [ ] Navegación funciona
- [ ] Imágenes cargan

### 2. Catálogo y Productos
- [ ] Ver productos
- [ ] Ver cajas
- [ ] Filtros funcionan (si están implementados)
- [ ] Navegación entre categorías

### 3. Funcionalidades Básicas
- [ ] Cambiar idioma (si está implementado)
- [ ] Buscar productos (si está implementado)
- [ ] Ver detalles de productos

### 4. Funcionalidades que Requieren Backend
⚠️ **Estas NO funcionarán aún** (el backend no está desplegado):
- [ ] Login con Google
- [ ] Agregar al carrito (persistencia)
- [ ] Checkout
- [ ] Panel admin

---

## 🔧 Si Ves la Versión Vieja

### Solución 1: Limpiar Cache
1. **Abre en modo incógnito:**
   - Chrome: `Cmd+Shift+N` (Mac) o `Ctrl+Shift+N` (Windows)
   - Firefox: `Cmd+Shift+P` (Mac) o `Ctrl+Shift+P` (Windows)
   - Safari: `Cmd+Shift+N`

2. **O haz hard refresh:**
   - Mac: `Cmd+Shift+R`
   - Windows/Linux: `Ctrl+Shift+R`

### Solución 2: Verificar que Estés en la URL Correcta
- ✅ Usa: `https://gd-web-git-test-build-ayudames-projects.vercel.app`
- ❌ NO uses: URLs de producción antiguas o de la rama `main`

### Solución 3: Promover el Deployment a Producción
Si quieres que la URL de producción muestre la versión nueva:

1. Ve a: https://vercel.com/gd-web/deployments
2. Busca el deployment de `test-build` más reciente
3. Click en los **"..."** (tres puntos)
4. Click en **"Promote to Production"**
5. Espera 1-2 minutos
6. La URL de producción mostrará la versión nueva

---

## 📊 Estado del Deployment

### Último Push
- **Commit:** `5251ebe`
- **Mensaje:** "fix: mejorar páginas de error para evitar styled-jsx durante prerenderizado"
- **Branch:** `test-build`
- **Estado:** Pusheado a GitHub ✅

### Build Status
- **Local:** ✅ Completa con warnings (esperado)
- **Vercel:** ⏳ Debería estar construyendo o ya completado

---

## 🐛 Reportar Problemas

Si encuentras problemas al probar la página:

1. **Toma capturas de pantalla** del problema
2. **Anota la URL** donde ocurre
3. **Describe qué estabas haciendo** cuando ocurrió
4. **Revisa la consola del navegador** (F12 → Console) para ver errores

---

## 📝 Notas Importantes

1. **Backend no desplegado:** Las funcionalidades que requieren API no funcionarán aún
2. **Variables de entorno:** `NEXT_PUBLIC_API_BASE_URL` está configurado como `http://localhost:5001/api`
3. **Páginas de error:** Pueden mostrar warnings durante el build, pero funcionan correctamente en runtime

---

**¡Listo para probar! 🚀**







