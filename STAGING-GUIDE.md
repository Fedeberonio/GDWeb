# 🌐 Guía para Probar la Nueva Versión de Green Dolio

Este documento te lleva paso a paso para validar la versión en desarrollo sin afectar la web publicada.

---

## 1. Preparar el entorno local

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta el servidor local:
   ```bash
   ./serve-local.sh
   ```
   - Usa la variable `PORT` si prefieres otro puerto: `PORT=8080 ./serve-local.sh`.
3. Ingresa en tu navegador a `http://localhost:8000`.

> ℹ️ **Por qué es necesario:** Las funciones de autenticación de Google/Firebase requieren que la app se sirva desde un dominio HTTP/HTTPS autorizado. Abrir `index.html` con doble clic (`file://`) bloquea el login y el modal de perfil.

---

## 2. Autorizar el dominio local en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) → tu proyecto → **Authentication**.
2. Pestaña **Settings** → sección **Authorized domains**.
3. Agrega `localhost` (si no está) y `127.0.0.1`.
4. Si usarás otro puerto o dominio temporal, agrégalo también.

---

## 3. Flujo de pruebas recomendado

### Usuario nuevo
- Inicia sesión con una cuenta de Google que no tenga documento en `users`.
- Debe aparecer el modal de “Completa tu perfil”.
- Completa y guarda; verifica que los datos aparecen luego en el checkout.

### Usuario recurrente
- Cierra sesión y vuelve a iniciar.
- Asegúrate de que no aparezca el modal y que los campos se autocompleten.
- Realiza una compra: agrega productos, configura caja, confirma y genera el mensaje de WhatsApp.

### Carrito y persistencia
- Cierra la pestaña del WhatsApp Web y regresa: los items deben seguir en el carrito.
- Cierra sesión → confirma que el carrito se limpia y se guarda en Firestore.

---

## 4. Staging online (opcional, antes de producción)

1. Sube la rama de trabajo:
   ```bash
   git push origin feature/nueva-version
   ```
2. Crea una instancia staging (Firefly/Vercel/etc.) apuntando a esa rama.
3. Copia las variables de entorno/Firebase y autoriza el nuevo dominio en Firebase Authentication.
4. Repite el flujo de pruebas en el subdominio staging.

> ✅ Con esto puedes validar la experiencia “real” sin tocar la web en producción.

---

## 5. Volver a la versión publicada (si es necesario)

- Cambia a la rama de respaldo:
  ```bash
  git checkout backup-produccion
  ```
- O usa el tag:
  ```bash
  git checkout produccion-estable
  ```
- Despliega desde allí para restaurar la versión conocida.

---

## 6. Lista Rápida de Verificación

- [ ] Servidor local corriendo (`./serve-local.sh`).
- [ ] `localhost` autorizado en Firebase.
- [ ] Modal aparece solo para usuarios nuevos.
- [ ] Checkout autocompleta datos guardados.
- [ ] Carrito persiste tras volver de WhatsApp.
- [ ] Rama staging desplegada y probada (si aplica).

---

¿Algo no salió como esperabas? Revisa la consola del navegador (F12) y la salida del servidor. Anota los mensajes y avísame para ayudarte a depurarlo.
