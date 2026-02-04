# 🚀 Cómo hacer push de la rama test-build

## Estado Actual
- ✅ Rama `test-build` creada localmente
- ✅ 5 commits listos (incluyendo el proyecto completo)
- ⏳ Falta: Push a GitHub

## Pasos para hacer push

### Opción 1: Desde la Terminal (Recomendado)

1. Abre la terminal
2. Ejecuta:

```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
git push origin test-build
```

3. Si te pide credenciales:
   - **Usuario:** Tu usuario de GitHub (ej: `Fedeberonio`)
   - **Contraseña:** Usa un **Personal Access Token** (NO tu contraseña normal)
   
   Para crear un token:
   - Ve a: https://github.com/settings/tokens
   - Click en "Generate new token (classic)"
   - Nombre: "GDWeb Push"
   - Permisos: Marca `repo` (acceso completo a repositorios)
   - Click en "Generate token"
   - **Copia el token** (solo se muestra una vez)
   - Úsalo como contraseña cuando Git te lo pida

### Opción 2: Desde GitHub Desktop (Si lo tienes instalado)

1. Abre GitHub Desktop
2. Selecciona la rama `test-build`
3. Click en "Publish branch" o "Push origin"

### Opción 3: Desde VS Code

1. Abre VS Code en la carpeta del proyecto
2. Ve a la pestaña "Source Control" (Ctrl+Shift+G)
3. Verás la rama `test-build` con commits pendientes
4. Click en "..." → "Push" → "Push to origin/test-build"

## Verificar que funcionó

Después del push, ve a GitHub:
- https://github.com/Fedeberonio/GDWeb/branches
- Deberías ver la rama `test-build` en la lista

O directamente:
- https://github.com/Fedeberonio/GDWeb/tree/test-build

## Si tienes problemas

### Error: "could not read Username"
- Configura Git con tus credenciales:
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Error: "Authentication failed"
- Usa un Personal Access Token en lugar de tu contraseña
- Verifica que el token tenga permisos `repo`

### Error: "Permission denied"
- Verifica que tengas acceso de escritura al repositorio
- Si es un fork, puede que necesites hacer un Pull Request en lugar de push directo

## ¿Qué pasa después del push?

1. ✅ La rama `test-build` aparecerá en GitHub
2. ✅ Podrás configurarla en Vercel
3. ✅ La rama `main` NO se toca (tu página sigue funcionando)
4. ✅ GitHub Pages sigue sirviendo desde `main`

## Seguridad

- ✅ Push a `test-build` NO afecta `main`
- ✅ GitHub Pages sigue usando `main`
- ✅ `greendolio.shop` NO se ve afectado
- ✅ Solo creas una rama nueva en GitHub










