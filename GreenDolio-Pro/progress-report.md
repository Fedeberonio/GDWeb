# Green Dolio Pro — Reporte de Avance

**Última actualización:** 2025-11-28

## 1. Panorama General

- Monorepo con `apps/web` (Next.js 14 + React 18 + Tailwind 4 + Firebase client) y `apps/api` (Express + TypeScript + Firebase Admin).
- API expone catálogo público (`/api/catalog`), rutas admin protegidas (`/api/admin/catalog`, `/api/admin/uploads`) y módulo de pedidos (`/api/admin/orders`).
- Firestore centraliza productos, cajas, historial (`catalog_history`) y pedidos.
- Assets organizados en `GreenDolio_BrandAssets/` (logos, paleta, tipografías, fotografía, iconos, templates, videos).

## 2. Objetivos cumplidos recientes

1. **Panel administrativo**
   - `/admin/products`, `/admin/boxes`, `/admin/history`, `/admin/orders`, `/admin/requests` siguen operativos con allowlist de correos y subida de imágenes a Firebase Storage.
2. **Builder + carrito (mejorado)**
   - Builder calcula precio base, extras y estado A la Carta; puede agregar la caja personalizada al carrito.
   - Carrito guarda la configuración de la caja (productos, gustos, entrega) y precio final.
3. **Checkout mínimo**
   - Página `/checkout` envía pedidos a un endpoint público `/api/orders` y los guarda en Firestore como `pending`.
4. **Datos/landing**
   - Catálogo y rules 25nov cargados; filtros “baby” aplicados al catálogo público. Landing y secciones principales visibles.
5. **Higiene + ramas**
   - Se creó `legacy-ghpages` para servir la web vieja en GitHub Pages y se limpió el repo de archivos basura (`.DS_Store`) con `.gitignore` actualizado.

## 3. Estado Actual y Diagnóstico

### ✅ Completado
- Panel administrativo completo con todas las funcionalidades core
- Builder de cajas con validación y persistencia
- Sistema de catálogo con 76 productos sincronizados
- Assets de marca organizados (199+ imágenes)
- Flujo de swap en cajas mostrando correctamente los productos reemplazados y agregados
- Catálogo y box rules actualizados con dataset 25nov; productos baby (solo Box 1) cargados en metadata/Firestore pero ocultos del catálogo público

### ⚠️ Pendiente Crítico
- **Build roto en producción**: `next build` falla al prerender `/404` y `/500` (styled-jsx/useContext). `tsc` del API sigue fallando (zod/typing en boxes, boxBuilderRequests, orders, scripts). Dev funciona (`npm run dev:web` / `npm run dev:api` con envs).
- **Precio de swaps no visible**: cuando se agrega una caja personalizada con extras (swap que encarece), el exceso no se refleja en el carrito ni en el flujo de checkout.
- **Integración de pagos**: sigue pendiente.
- **Persistencia en backend**: carrito solo en cliente; pedidos se guardan como borrador en Firestore pero sin cálculo de extras robusto.
- **Rutas de deploy**: falta reconfigurar Vercel apuntando a `GreenDolio-Pro/apps/web` (branch de staging `test-build`) y confirmar subdominio de pruebas.

### ⚠️ Bloqueos de build (detalles)
- Web: error de prerender en `/404` y `/500` (styled-jsx useContext null). Se requiere página de error mínima sin dependencias.
- API: `tsc` rompe en módulos de boxes/boxBuilderRequests/orders (zod `.record`, tipos `unknown`, campos opcionales). Scripts de catálogo también fallan con exactOptionalPropertyTypes.

### 📋 Plan Estratégico Creado
- Se ha creado un plan estratégico completo en `PLAN-ESTRATEGICO-E-COMMERCE-RD.md`
- Roadmap de 6 fases para convertir Green Dolio en el mejor e-commerce de RD
- Prioridades inmediatas: Carrito → Checkout → Pagos → Mejoras Visuales

## 4. Próximos pasos sugeridos

1. **FASE 1: Fundación Sólida (Semanas 1-4)** ⭐ CRÍTICO
   - Consolidar el carrito y enlazarlo con `/armar` para que el builder pre-cargue cajas/pedidos.
   - QA del flujo de swaps y contenidos personalizados en landing/builder y guardar composición en carrito o solicitud.
   - Crear flujo de checkout con resumen universal (carrito → builder → solicitud) y backend `/api/boxes/requests`.
   - Integrar gateway de pagos (PayPal + Stripe + Cash on Delivery) y guardar preferencias.
   - Mantener mejoras visuales (hero, sostenibilidad, vida de la caja) usando los datos de `LISTA COMPLETA...` y `Combos Almuerzo`.
   - Revisar slugs y contenidos de `boxRules` regenerados desde CSV 25nov; ajustar si hay desalineaciones puntuales.

2. **FASE 2: Experiencia de Usuario Premium (Semanas 5-8)**
   - Búsqueda inteligente con autocompletado
   - Filtros avanzados y ordenamiento
   - Páginas de producto mejoradas con reviews
   - Wishlist y favoritos
   - PWA para mobile

3. **FASE 3: Marketing y Conversión (Semanas 9-12)**
   - SEO técnico y contenido
   - Email marketing y automation
   - Sistema de cupones y descuentos
   - Programa de fidelización
   - Analytics completo (GA4)

4. **FASE 4: Funcionalidades Avanzadas (Semanas 13-16)**
   - Automatizar favoritos/dislikes por usuario registrado + notificaciones.
   - Tracking de pedidos y dashboards de logística.
   - Chat embed (sin depender de WhatsApp por producto) + recomendaciones personalizadas.

## 5. Tareas operativas

- Ejecutar siempre backend (`npm run dev:api`) + frontend (`npm run dev:web`) antes de usar panel.
- Mantener `.env` sincronizados entre web/backend (Firebase + correos permitidos).
- Cada nuevo asset debe copiarse a `public/` o configurarse en `next.config.ts` (remotePatterns) y reiniciar `npm run dev:web`.
- Registrar cambios relevantes en este archivo (fecha + puntos clave) al finalizar cada sesión.
- GitHub Pages usa `legacy-ghpages` para la web estática; `test-build`/`main` quedan para la nueva app (Next.js + Vercel). `.DS_Store` y artefactos generados ya se ignoran.

---

> Actualiza este reporte cada vez que avances (cambia la fecha y ajusta las secciones 2–4). Así no tendrás que reexplicar el contexto en chat siguientes.
