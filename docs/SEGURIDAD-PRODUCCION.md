# 🔒 Seguridad: Por qué NO vas a arruinar la página en producción

## ✅ Garantías de Seguridad

### 1. **Ramas Separadas**
```
main (producción)     → greendolio.shop (GitHub Pages)
test-build (testing)  → vercel.app (Vercel - URL diferente)
```

- **`main`**: Contiene tu página actual (`index.html`, `script.js`, etc.)
- **`test-build`**: Contiene solo cambios en `GreenDolio-Pro/` (nuevo proyecto)

### 2. **GitHub Pages está configurado en `main`**

GitHub Pages **siempre** sirve desde la rama `main` (o la que configuraste en Settings). 
- Al hacer `git push origin test-build`, estás pusheando una rama **diferente**
- GitHub Pages **NO** cambia automáticamente de rama
- Tu página en `greendolio.shop` sigue sirviendo desde `main`

### 3. **Los cambios están en una carpeta separada**

```
GDWeb/
├── index.html          ← Página actual (NO se toca)
├── script.js           ← Página actual (NO se toca)
├── main.css            ← Página actual (NO se toca)
├── CNAME               ← Dominio actual (NO se toca)
└── GreenDolio-Pro/     ← NUEVO proyecto (solo esto cambia)
    ├── apps/web/
    └── apps/api/
```

**Todos los cambios en `test-build` están dentro de `GreenDolio-Pro/`**
- La raíz del repositorio (`index.html`, etc.) **NO se modifica**
- GitHub Pages sirve desde la raíz, que sigue igual en `main`

### 4. **Vercel usa una rama diferente**

Cuando configures Vercel:
- **Branch:** `test-build` (no `main`)
- **Root Directory:** `GreenDolio-Pro/apps/web`
- **URL:** `greendolio-pro-test-xxx.vercel.app` (diferente a `greendolio.shop`)

Vercel **NO** puede afectar GitHub Pages porque:
- Usa una rama diferente (`test-build`)
- Usa una carpeta diferente (`GreenDolio-Pro/apps/web`)
- Genera una URL completamente diferente

### 5. **Comparación de commits**

```
main (producción):
  f5393b4 Ultimo Online          ← Esto está en producción
  fb0dc11 Update script.js
  ...

test-build (testing):
  c7eaf4e docs: agregar scripts   ← Esto NO está en producción
  4378722 docs: guía deploy
  36a4e13 Fix: páginas error
  20a798e Test: correcciones
  f5393b4 Ultimo Online          ← Comparte este commit con main
```

**`main` y `test-build` comparten el commit base (`f5393b4`), pero `test-build` tiene commits adicionales que NO están en `main`.**

## 🛡️ Protecciones Adicionales

### GitHub Pages Settings
Para verificar/confirmar:
1. Ve a: https://github.com/Fedeberonio/GDWeb/settings/pages
2. Verifica que **Source** esté en `main` (no `test-build`)
3. **NO cambies esto** hasta que quieras hacer el switch oficial

### Dominio Separado
- **Producción:** `greendolio.shop` → GitHub Pages → `main`
- **Testing:** `greendolio-pro-test-xxx.vercel.app` → Vercel → `test-build`

Son **completamente independientes**.

## ✅ Checklist de Seguridad

Antes de hacer push, verifica:

- [x] Estás en la rama `test-build` (no `main`)
- [x] Los cambios están solo en `GreenDolio-Pro/`
- [x] No modificaste `index.html`, `script.js`, `main.css` en la raíz
- [x] No modificaste `CNAME`
- [x] GitHub Pages está configurado en `main`

## 🚨 ¿Qué pasaría si...?

### Si accidentalmente pusheas a `main`?
- GitHub Pages se actualizaría automáticamente
- **PERO** como los cambios están en `GreenDolio-Pro/`, la página seguiría igual
- Solo verías archivos nuevos en el repo, pero `index.html` seguiría siendo el mismo

### Si cambias la rama de GitHub Pages a `test-build`?
- La página actual dejaría de funcionar (porque `test-build` no tiene `index.html` en la raíz)
- **PERO** esto requiere ir a Settings y cambiarlo manualmente
- **NO puede pasar automáticamente**

## 📋 Resumen

✅ **Es 100% seguro hacer push de `test-build`**
- No afecta `main`
- No afecta GitHub Pages
- No afecta `greendolio.shop`
- Solo crea una rama nueva en GitHub
- Vercel usará esa rama en una URL diferente

## 🔄 Cuando quieras hacer el switch oficial

Solo entonces:
1. Merge `test-build` → `main` (cuando estés listo)
2. Cambia GitHub Pages a servir desde otra ubicación
3. O desactiva GitHub Pages y usa solo Vercel

**Pero eso es para más adelante. Por ahora, estás 100% seguro.**










