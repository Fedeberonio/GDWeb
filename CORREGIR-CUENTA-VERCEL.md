# ⚠️ CORRECCIÓN: Cambiar a Cuenta Correcta de Vercel

## ❌ Problema Detectado

Se estaba usando la cuenta incorrecta:
- **Cuenta incorrecta:** ai.management@archipielagofilm.com (aimanagement-1931)
- **Cuenta correcta:** greendolioexpress@gmail.com

## ✅ Acciones Tomadas

1. ✅ Logout de la cuenta incorrecta
2. ✅ Eliminación de configuración local (.vercel)
3. ⏳ Pendiente: Autenticación con cuenta correcta

---

## 🔧 Pasos para Corregir

### Paso 1: Obtener Token de Vercel de la Cuenta Correcta

1. Ve a: https://vercel.com/account/tokens
2. **Asegúrate de estar logueado con:** greendolioexpress@gmail.com
3. Click en **"Create Token"**
4. Nombre: `GreenDolio-Deploy`
5. Scope: **Full Account** (o los permisos necesarios)
6. Click en **"Create"**
7. **Copia el token** (solo se muestra una vez)

### Paso 2: Autenticarse con la Cuenta Correcta

**Opción A - Con Token (Recomendado):**
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
export VERCEL_TOKEN=[TU_TOKEN_DE_GREENDOLIOEXPRESS]
vercel whoami
```

**Opción B - Login Interactivo:**
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
vercel login
# Selecciona: Email
# Ingresa: greendolioexpress@gmail.com
# Sigue las instrucciones
```

### Paso 3: Verificar Cuenta

```bash
vercel whoami
# Debe mostrar: greendolioexpress o similar (NO aimanagement)
```

### Paso 4: Eliminar Proyectos Creados con Cuenta Incorrecta

Si se crearon proyectos con la cuenta incorrecta, necesitas:

1. Ve a: https://vercel.com/aimanagements-projects
2. Elimina el proyecto `web` si existe
3. O transfiérelo a la cuenta correcta

### Paso 5: Crear Nuevo Proyecto con Cuenta Correcta

Una vez autenticado con la cuenta correcta:

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
export VERCEL_TOKEN=[TOKEN_CORRECTO]
vercel --prod=false
```

---

## ⚠️ IMPORTANTE

- **NUNCA** uses tokens o credenciales de ai.management@archipielagofilm.com
- **SIEMPRE** verifica con `vercel whoami` antes de hacer deploy
- **SIEMPRE** usa la cuenta: greendolioexpress@gmail.com

---

## 🔄 Script de Verificación

Crea este script para verificar siempre la cuenta:

```bash
#!/bin/bash
# verificar-cuenta-vercel.sh

CURRENT_USER=$(vercel whoami 2>&1)

if [[ "$CURRENT_USER" == *"aimanagement"* ]] || [[ "$CURRENT_USER" == *"archipielago"* ]]; then
    echo "❌ ERROR: Estás usando la cuenta incorrecta!"
    echo "Cuenta actual: $CURRENT_USER"
    echo "Debes usar: greendolioexpress@gmail.com"
    exit 1
fi

echo "✅ Cuenta correcta: $CURRENT_USER"
```

---

## 📋 Checklist

- [ ] Logout de cuenta incorrecta ✅ (Ya hecho)
- [ ] Eliminación de .vercel ✅ (Ya hecho)
- [ ] Obtener token de greendolioexpress@gmail.com
- [ ] Autenticarse con cuenta correcta
- [ ] Verificar con `vercel whoami`
- [ ] Eliminar proyectos de cuenta incorrecta (si existen)
- [ ] Crear nuevo proyecto con cuenta correcta
- [ ] Configurar variables de entorno en cuenta correcta
- [ ] Hacer deploy con cuenta correcta

---

## 🆘 Si Necesitas Ayuda

Una vez que tengas el token de la cuenta correcta, dímelo y:
1. Configuraré todo automáticamente
2. Configuraré las variables de entorno
3. Haré el deploy correcto

**IMPORTANTE:** No uses el token anterior (BlHxzfmDnnCzS6vEXvEh5HbA) porque está asociado a la cuenta incorrecta.
