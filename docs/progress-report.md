# Green Dolio Pro — Reporte de Avance

**Última actualización:** 2025-01-18

## 1. Panorama General

- **Monorepo** con `apps/web` (Next.js 14 + React 18 + Tailwind 4 + Firebase client) y `apps/api` (Express + TypeScript + Firebase Admin).
- **API** expone catálogo público (`/api/catalog`), rutas admin protegidas (`/api/admin/catalog`, `/api/admin/uploads`) y módulo de pedidos (`/api/admin/orders`).
- **Firestore** centraliza productos, cajas, combos, historial (`catalog_history`) y pedidos.
- **Assets** organizados en `GreenDolio_BrandAssets/` (logos, paleta, tipografías, fotografía, iconos, templates, videos).
- **Deploy:** Vercel (cuenta greendolioexpress@gmail.com, team: gds-projects-1bbb6204)
- **URL Producción:** https://web-exkj95bf1-gds-projects-1bbb6204.vercel.app

## 2. Estado Actual del Proyecto

### ✅ Funcionalidades Completadas

#### 2.1 Panel Administrativo Completo
- **Productos** (`/admin/products`): Edición completa de nombres (ES/EN), descripciones, precios, valores nutricionales, logística, dimensiones, SKU, imágenes
- **Cajas** (`/admin/boxes`): Edición de nombres, descripciones, precios, duración, imágenes, variantes (nombres, descripciones, highlights, contenido de referencia)
- **Combos** (`/admin/combos`): Edición completa de combos de almuerzo (nombres, descripciones, precios, información nutricional, ingredientes, imágenes)
- **Reglas de Cajas** (`/admin/box-rules`): Edición de reglas con campos individuales (no solo JSON)
- **Pedidos** (`/admin/orders`): Visualización y gestión de pedidos
- **Historial** (`/admin/history`): Auditoría de cambios en catálogo
- **Solicitudes** (`/admin/requests`): Gestión de solicitudes de cajas personalizadas
- **Subida de Imágenes:** Integración con Firebase Storage funcionando correctamente

#### 2.2 Sistema de Checkout y Pedidos
- **Flujo de Checkout:** Formulario completo con validación
- **Envío por WhatsApp:** Los pedidos se envían automáticamente por WhatsApp con todos los detalles
- **Métodos de Pago:** Cash, Transferencia, PayPal, Tarjeta (selección en checkout)
- **Persistencia:** Pedidos guardados en Firestore con estado `pending`
- **Resumen de Pedido:** Vista completa antes de enviar por WhatsApp

#### 2.3 Carrito de Compras
- **Context API:** Carrito funcional con persistencia
- **Drawer Lateral:** Carrito deslizable con resumen de productos
- **Integración:** Funciona con productos individuales y cajas
- **Botón "Confirmar Pedido":** Navega al checkout (botón "Ir a Pagar" eliminado)

#### 2.4 Catálogo y Productos
- **76 Productos** sincronizados en Firestore
- **Categorías:** Frutas, Vegetales, Granja, Productos Caseros, Elaborados
- **Localización:** Nombres y descripciones en ES/EN
- **Imágenes:** Sistema de fallback para imágenes faltantes
- **Filtros:** Por categoría funcionando

#### 2.5 Cajas Personalizadas
- **Builder de Cajas** (`/armar`): Flujo completo para personalizar cajas
- **3 Cajas Pre-armadas:** Caribbean Fresh Pack, Island Weekssential, AllGreenXclusive
- **Variantes:** Mix, Fruity, Veggie
- **Validación:** Reglas de cajas implementadas
- **Visualización:** Preview de cajas con estadísticas

#### 2.6 Combos de Almuerzo
- **7 Combos** importados a Firestore
- **API:** Rutas públicas y admin funcionando
- **Visualización:** Sección en homepage
- **Admin:** Edición completa de todos los campos

#### 2.7 Internacionalización (i18n)
- **Idiomas:** Español (ES) e Inglés (EN)
- **Traducciones:** Nombres de productos, descripciones, categorías, UI
- **Selector:** Cambio de idioma funcional
- **Persistencia:** Preferencia guardada en cookies

#### 2.8 Mejoras Visuales Implementadas
- **Splash Screen:** Logo de bienvenida con animación rápida
- **How it Works:** Imagen dinámica con animaciones y hover effects
- **Botones Sociales:** WhatsApp e Instagram (ocultos en admin)
- **Navegación:** Botones funcionando desde cualquier página
- **Imágenes de Productos:** Ajustes para mostrar botellas y paquetes completos
- **Categorías:** Fondo de tarjetas usando imágenes de homepage

#### 2.9 Deploy y Configuración
- **Vercel:** Configurado con cuenta greendolioexpress@gmail.com
- **Variables de Entorno:** Todas configuradas (Firebase, API, etc.)
- **Scripts:** `deploy.sh` y `configurar-vars-vercel.sh` disponibles
- **Build:** Funcionando correctamente (páginas dinámicas)
- **Separación:** Completamente separado de producción (www.greendolio.shop)

### ⚠️ Pendiente o En Progreso

#### 2.10 Funcionalidades Pendientes
- **Integración de Pagos:** PayPal, Stripe, Cash on Delivery (estructura lista, falta integración real)
- **Búsqueda de Productos:** No implementada
- **Filtros Avanzados:** Solo por categoría básico
- **Wishlist/Favoritos:** No implementado
- **Reviews/Ratings:** No implementado
- **Tracking de Pedidos:** Básico, falta dashboard avanzado
- **Notificaciones:** Solo por WhatsApp, falta sistema interno
- **SEO Avanzado:** Básico implementado, falta optimización completa
- **Analytics:** No implementado (GA4 pendiente)
- **PWA:** No implementado

## 3. Arquitectura Técnica

### 3.1 Frontend (apps/web)
- **Framework:** Next.js 14.2.35 con App Router
- **React:** 18.x
- **TypeScript:** Configurado end-to-end
- **Estilos:** Tailwind CSS 4
- **Estado:** Context API (carrito, usuario, catálogo)
- **i18n:** Sistema propio con `useTranslation` hook
- **Componentes Principales:**
  - `BoxCustomizeModal`: Modal para personalizar cajas
  - `QuickAddModal`: Modal para agregar cajas rápidamente
  - `CartDrawer`: Drawer del carrito
  - `CheckoutClient`: Cliente del checkout
  - `ProductManager`, `BoxManager`, `ComboManager`: Componentes admin

### 3.2 Backend (apps/api)
- **Framework:** Express + TypeScript
- **Firebase Admin:** Firestore, Storage, Auth
- **Rutas Principales:**
  - `/api/catalog/*`: Catálogo público
  - `/api/admin/catalog/*`: Catálogo admin (protegido)
  - `/api/admin/uploads`: Subida de imágenes
  - `/api/orders`: Pedidos públicos
  - `/api/admin/orders/*`: Pedidos admin
- **Validación:** Zod schemas
- **Autenticación:** Admin session con allowlist de emails

### 3.3 Base de Datos (Firestore)
- **Colecciones:**
  - `catalog_products`: Productos
  - `catalog_boxes`: Cajas
  - `catalog_combos`: Combos de almuerzo
  - `catalog_categories`: Categorías
  - `catalog_box_rules`: Reglas de cajas
  - `catalog_history`: Historial de cambios
  - `orders`: Pedidos
  - `box_builder_requests`: Solicitudes de cajas personalizadas
  - `user_profiles`: Perfiles de usuario

### 3.4 Storage (Firebase Storage)
- **Imágenes de Productos:** `/products/`
- **Imágenes de Cajas:** `/boxes/`
- **Imágenes de Combos:** `/combos/`
- **Uploads Admin:** `/uploads/`

## 4. Flujos Principales Implementados

### 4.1 Flujo de Compra
1. Usuario navega catálogo o selecciona caja
2. Agrega productos/cajas al carrito
3. Abre carrito y presiona "Confirmar Pedido"
4. Completa formulario de checkout
5. Ve resumen del pedido
6. Presiona "Enviar Pedido por WhatsApp"
7. Pedido se envía por WhatsApp y se guarda en Firestore

### 4.2 Flujo de Personalización de Cajas
1. Usuario selecciona caja desde homepage
2. Elige variante (Mix, Fruity, Veggie)
3. Personaliza productos (likes/dislikes)
4. Ve preview con estadísticas
5. Agrega al carrito o continúa personalizando

### 4.3 Flujo Admin
1. Admin inicia sesión (allowlist de emails)
2. Navega a sección deseada (Productos, Cajas, Combos, etc.)
3. Selecciona item para editar
4. Modifica campos en formulario
5. Sube imágenes si es necesario
6. Guarda cambios (se persisten en Firestore)

## 5. Configuración de Deploy

### 5.1 Vercel
- **Cuenta:** greendolioexpress@gmail.com
- **Team:** GD's projects (gds-projects-1bbb6204)
- **Token:** BlHxzfmDnnCzS6vEXvEh5HbA
- **URL Producción:** https://web-exkj95bf1-gds-projects-1bbb6204.vercel.app
- **Build:** Automático en push a `test-build` branch

### 5.2 Comandos de Deploy
```bash
# Deploy rápido (preview)
cd apps/web
vercel --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204 --prod=false --yes

# Configurar variables de entorno
cd ..
./configurar-vars-vercel.sh
```

### 5.3 Variables de Entorno Requeridas
- `NEXT_PUBLIC_API_BASE_URL`: URL del backend API
- `NEXT_PUBLIC_FIREBASE_*`: Configuración Firebase client
- `FIREBASE_*`: Configuración Firebase Admin (backend)
- `ADMIN_ALLOWLIST`: Lista de emails permitidos para admin

## 6. Datos y Catálogo

### 6.1 Productos
- **Total:** 76 productos activos
- **Categorías:** Frutas (20), Vegetales (30+), Granja (10+), Productos Caseros (5+), Elaborados (10+)
- **Localización:** Nombres y descripciones en ES/EN
- **Imágenes:** Sistema de fallback implementado

### 6.2 Cajas
- **3 Cajas Pre-armadas:**
  - Caribbean Fresh Pack (3 días)
  - Island Weekssential (1 semana)
  - AllGreenXclusive (2 semanas)
- **Variantes:** Mix, Fruity, Veggie
- **Reglas:** Validación de presupuesto, peso, márgenes

### 6.3 Combos
- **7 Combos de Almuerzo:**
  - Todos importados a Firestore
  - Información nutricional completa
  - Ingredientes localizados

## 7. Problemas Conocidos y Soluciones

### 7.1 Resueltos
- ✅ **Error al abrir detalles de cajas:** Validación demasiado estricta corregida
- ✅ **Formulario admin de cajas complicado:** Mejorado con campos individuales y secciones colapsables
- ✅ **Combos no visibles en admin:** Rutas de API creadas y funcionando
- ✅ **Botones sociales en admin:** Ocultos automáticamente en rutas `/admin/*`
- ✅ **Traducciones faltantes:** Corregidas y verificadas
- ✅ **Imágenes faltantes en carrito:** Sistema de fallback implementado

### 7.2 Pendientes
- ⚠️ **Build warnings:** Algunos warnings de Next.js durante build (no críticos)
- ⚠️ **Optimización de imágenes:** Falta implementar WebP/AVIF
- ⚠️ **Lazy loading:** Mejorar carga de imágenes
- ⚠️ **SEO:** Falta optimización avanzada

## 8. Próximos Pasos Sugeridos

### 8.1 Prioridad Alta (Próximas 2 Semanas)
1. **Integración de Pagos Real:**
   - PayPal API completa
   - Stripe para tarjetas
   - Cash on Delivery workflow

2. **Búsqueda de Productos:**
   - Barra de búsqueda en header
   - Autocompletado
   - Filtros avanzados

3. **Optimización de Performance:**
   - Lazy loading de imágenes
   - Code splitting
   - Optimización de bundle

### 8.2 Prioridad Media (Próximo Mes)
1. **Wishlist/Favoritos:**
   - Guardar productos favoritos
   - Sincronización con usuario

2. **Reviews y Ratings:**
   - Sistema de reviews
   - Visualización en productos

3. **Tracking Avanzado:**
   - Dashboard de pedidos
   - Notificaciones por email

### 8.3 Prioridad Baja (Futuro)
1. **PWA:**
   - Service Worker
   - Instalación offline

2. **Analytics:**
   - Google Analytics 4
   - Eventos personalizados

3. **Marketing:**
   - Cupones y descuentos
   - Programa de fidelización

## 9. Comandos Útiles

### 9.1 Desarrollo Local
```bash
# Iniciar backend
cd apps/api
npm run dev

# Iniciar frontend
cd apps/web
npm run dev

# Build de producción
cd apps/web
npm run build
```

### 9.2 Importación de Datos
```bash
# Importar catálogo desde Excel
cd apps/api
npm run import:catalog

# Importar combos desde Excel
cd apps/api
npm run import:combos
```

### 9.3 Deploy
```bash
# Deploy a Vercel (preview)
cd apps/web
vercel --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204 --prod=false --yes

# Deploy a producción
vercel --token BlHxzfmDnnCzS6vEXvEh5HbA --scope gds-projects-1bbb6204 --prod=true --yes
```

## 10. Estructura de Archivos Importantes

### 10.1 Frontend
- `apps/web/src/app/`: Páginas y rutas
- `apps/web/src/app/_components/`: Componentes reutilizables
- `apps/web/src/modules/`: Módulos (admin, cart, catalog, i18n, user, orders)
- `apps/web/src/lib/`: Utilidades y configuraciones

### 10.2 Backend
- `apps/api/src/modules/`: Módulos (auth, catalog, orders, uploads)
- `apps/api/src/scripts/`: Scripts de importación
- `apps/api/src/lib/`: Utilidades y configuraciones

### 10.3 Datos
- `data/`: Archivos Excel y CSV del catálogo
- `GreenDolio_BrandAssets/`: Assets de marca

## 11. Notas Importantes

### 11.1 Cuenta Vercel
- **SIEMPRE usar:** greendolioexpress@gmail.com
- **NUNCA usar:** Otras cuentas (ai.management@archipielagofilm.com, etc.)
- **Token:** BlHxzfmDnnCzS6vEXvEh5HbA
- **Scope:** gds-projects-1bbb6204

### 11.2 Separación de Producción
- **Producción actual:** www.greendolio.shop (GitHub Pages, branch `legacy-ghpages`)
- **Desarrollo/Testing:** Vercel (completamente separado)
- **No afectar:** La producción actual con cambios en este proyecto

### 11.3 Git
- **Branch principal:** `test-build` (para testing)
- **Branch producción:** `main` (no tocar sin confirmación)
- **Repositorio:** Separado del repo de producción

---

> **IMPORTANTE:** Actualiza este reporte cada vez que avances significativamente. Cambia la fecha y ajusta las secciones relevantes. Esto ayuda a mantener el contexto claro para futuras sesiones.
