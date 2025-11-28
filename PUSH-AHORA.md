# 🚀 Push Rápido - Instrucciones

## Opción 1: Usar el script (Más fácil)

1. **Copia tu token de GitHub** (de https://github.com/settings/tokens)
2. **Ejecuta en terminal:**

```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
bash push-con-token.sh ghp_tu_token_aqui
```

Reemplaza `ghp_tu_token_aqui` con tu token real.

## Opción 2: Push directo con token

```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
git push https://TU_TOKEN@github.com/Fedeberonio/GDWeb.git test-build
```

Reemplaza `TU_TOKEN` con tu token.

## Opción 3: Configurar credenciales una vez

Si quieres que Git recuerde tus credenciales:

```bash
cd "/Users/aimac/Documents/GDWeb Publicado 6 Nov"
git push -u origin test-build
```

Cuando pida credenciales:
- **Username:** `Fedeberonio`
- **Password:** pega tu token (no tu contraseña)

Git guardará las credenciales en el keychain de macOS.

## ¿Dónde está tu token?

Si ya lo creaste:
- Ve a: https://github.com/settings/tokens
- Si no lo ves, crea uno nuevo en: https://github.com/settings/tokens/new

## Después del push

Verifica que funcionó:
- https://github.com/Fedeberonio/GDWeb/branches
- Deberías ver la rama `test-build`




