# 🚀 Guía de Deploy - Green Dolio

## ⚠️ IMPORTANTE: Cuenta Correcta

**SIEMPRE usar la cuenta de greendolioexpress@gmail.com**

- **Cuenta Vercel:** greendolioexpress-1091
- **Team:** GD's projects (gds-projects-1bbb6204)
- **Token:** BlHxzfmDnnCzS6vEXvEh5HbA

---

## 📋 Deploy Rápido

### Opción 1: Script Automatizado (Recomendado)

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
./deploy.sh
```

### Opción 2: Comando Manual

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
vercel --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204 --prod=false
```

---

## 🔧 Configurar Variables de Entorno

Si necesitas configurar o actualizar variables de entorno:

```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"
./configurar-vars-vercel.sh
```

Este script configura automáticamente todas las variables necesarias con la cuenta correcta.

---

## ✅ Verificar Cuenta Antes de Deploy

Siempre verifica que estés usando la cuenta correcta:

```bash
vercel whoami --token BlHxzfmDnnCzS6vEXvEh5HbA
# Debe mostrar: greendolioexpress-1091
```

Si muestra otra cuenta, **NO HAGAS DEPLOY**. Contacta al administrador.

---

## 📍 URLs del Deployment

### Preview (Más Reciente):
**https://web-c8c53nqaa-gds-projects-1bbb6204.vercel.app**

### Ver todos los deployments:
```bash
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"
vercel ls --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

---

## 🔍 Comandos Útiles

### Ver logs de un deployment:
```bash
vercel logs [deployment-url] --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

### Ver variables de entorno:
```bash
vercel env ls --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

### Redeploy:
```bash
vercel redeploy [deployment-url] --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

---

## ⚠️ Variables de Entorno Configuradas

Las siguientes variables están configuradas en Production, Preview y Development:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS`

---

## 🆘 Solución de Problemas

### Error: "No existing credentials found"
```bash
# Usa siempre el token explícitamente:
vercel --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

### Error: Cuenta incorrecta
```bash
# Verifica la cuenta:
vercel whoami --token BlHxzfmDnnCzS6vEXvEh5HbA
# Debe mostrar: greendolioexpress-1091
```

### Build falla
```bash
# Ver logs:
vercel logs [deployment-url] --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204
```

---

## 📝 Notas Importantes

1. **NUNCA** uses tokens o credenciales de otras cuentas (ai.management, etc.)
2. **SIEMPRE** verifica la cuenta antes de hacer deploy
3. **SIEMPRE** usa el scope `gds-projects-1bbb6204`
4. Este deployment está **separado de producción** (www.greendolio.shop)

---

## ✅ Checklist Pre-Deploy

- [ ] Verificar cuenta: `vercel whoami --token BlHxzfmDnnCzS6vEXvEh5HbA`
- [ ] Estar en el directorio correcto: `apps/web`
- [ ] Cambios commiteados (opcional, pero recomendado)
- [ ] Ejecutar deploy con token y scope correctos

---

**Última actualización:** $(date)
