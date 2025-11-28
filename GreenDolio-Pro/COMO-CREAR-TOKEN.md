# 🔑 Cómo crear un Personal Access Token en GitHub

## Ruta directa

**URL directa:** https://github.com/settings/tokens

O sigue estos pasos:

## Pasos detallados

1. **Ve a tu perfil de GitHub:**
   - Click en tu foto de perfil (arriba a la derecha)
   - O ve a: https://github.com/settings/profile

2. **Ve a Developer settings:**
   - En el menú izquierdo, busca "Developer settings" (al final)
   - O ve directo a: https://github.com/settings/apps

3. **Personal access tokens:**
   - Click en "Personal access tokens"
   - Luego click en "Tokens (classic)"
   - O ve directo a: https://github.com/settings/tokens

4. **Generar nuevo token:**
   - Click en "Generate new token"
   - Selecciona "Generate new token (classic)"

5. **Configurar el token:**
   - **Note:** Ponle un nombre, ej: "GDWeb Push"
   - **Expiration:** Elige cuánto tiempo quieres que dure (90 días, 1 año, etc.)
   - **Select scopes:** Marca la casilla **`repo`** (esto da acceso completo a repositorios)
     - Esto incluye automáticamente: repo:status, repo_deployment, public_repo, repo:invite, security_events

6. **Generar:**
   - Scroll hacia abajo
   - Click en "Generate token" (botón verde)

7. **¡IMPORTANTE! Copia el token:**
   - GitHub te mostrará el token UNA SOLA VEZ
   - **Cópialo inmediatamente** (es una cadena larga tipo: `ghp_xxxxxxxxxxxxxxxxxxxx`)
   - Si lo pierdes, tendrás que crear uno nuevo

8. **Usar el token:**
   - Cuando Git te pida contraseña, pega este token
   - NO uses tu contraseña normal de GitHub

## Ruta visual

```
GitHub.com
  └─ Tu foto de perfil (arriba derecha)
     └─ Settings
        └─ Developer settings (al final del menú izquierdo)
           └─ Personal access tokens
              └─ Tokens (classic)
                 └─ Generate new token (classic)
```

## URL directa completa

**Para crear token nuevo:**
https://github.com/settings/tokens/new

**Para ver tokens existentes:**
https://github.com/settings/tokens




