# Notas de despliegue – versión estática anterior
**Fecha:** 2025-11-27  
**Propósito:** Dejar registrado cómo está publicada la versión legacy para consultas futuras mientras se migra a GreenDolio Pro.

## Hosting y dominio
- Hosting: GitHub Pages (repositorio `https://github.com/Fedeberonio/GDWeb.git`, branch principal `main`; worktree local `test-build`).
- Dominio: `CNAME` en la raíz con `greendolio.shop`, activando el custom domain en Pages. DNS apunta `greendolio.shop`/`www` a GitHub Pages.
- Publicación: al hacer push a `main`, Pages sirve los archivos estáticos desde la raíz (no hay build).

## Código servido en producción
- Front 100% estático: `index.html`, `main.css`, `script.js`, `firebase.js` en la raíz del repo.
- Sin frameworks ni bundler; se cargan directamente desde Pages.

## Firebase usado por la versión legacy
- Proyecto: `greendolio-tienda`.
- Config pública (`firebase.js`): `authDomain: greendolio-tienda.firebaseapp.com`, `storageBucket: greendolio-tienda.appspot.com`, `measurementId: G-H9F4SXPJPA`, API key incluida.
- SDK: compat v9 desde CDN (`firebase-app/auth/firestore`).
- Auth: Google OAuth únicamente (`GoogleAuthProvider`).
- Firestore:
  - Colección `users`: perfil (`telefono`, `direccion`, preferencias) y `carrito` sincronizado.
  - Colección `orders`: cada pedido con `userId`, `items`, `metodoPago`, `estado: "Recibido"`, timestamps; historial consultado con `where('userId'==uid).orderBy('createdAt')`.
- Otros servicios: Analytics activado. No se usa Storage ni Functions desde el front actual.

## Flujo hacia el dominio
- GitHub Pages sirve `https://fedeberonio.github.io/GDWeb`; `CNAME` fuerza host `greendolio.shop`.
- El front conecta directamente a Firebase (`greendolio-tienda`) para login/carrito/pedidos y abre WhatsApp en el checkout; no hay API propia en producción.

## Estado de GreenDolio Pro (nuevo, aún sin publicar)
- Monorepo en `GreenDolio-Pro/` con `apps/web` (Next.js 14 + Firebase client) y `apps/api` (Express + Firebase Admin).
- Requiere `.env` (ver `apps/web/.env.local.example` y `apps/api/.env.example`) con claves de Firebase y `NEXT_PUBLIC_API_BASE_URL`.
- `next.config.js` permite imágenes de Firebase y `greendolio.shop`; `apps/web/src/app/api/**` proxya hacia el backend configurado en env.
- Backend expone `/api/catalog`, `/api/orders`, `/api/admin/*`, protegido por ID token y allowlist de correos.
- Según `progress-report.md`, el build está roto y no hay hosting configurado aún (ni Vercel ni Firebase Hosting).
