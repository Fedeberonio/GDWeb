# ✅ CHECKLIST DE ACCIÓN INMEDIATA

**Objetivo:** Completar las funcionalidades críticas para tener un e-commerce funcional  
**Tiempo estimado:** 4 semanas  
**Prioridad:** CRÍTICA

---

## 🚨 SEMANA 1: Carrito de Compras

### Día 1-2: Estado y Context
- [ ] Crear `apps/web/src/modules/cart/types.ts` con tipos de carrito
- [ ] Crear `apps/web/src/modules/cart/context.tsx` con CartContext
- [ ] Implementar funciones: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- [ ] Persistencia en localStorage
- [ ] Sincronización con Firestore (para usuarios autenticados)

### Día 3-4: UI del Carrito
- [ ] Crear componente `CartDrawer` (drawer lateral)
- [ ] Crear componente `CartButton` con badge de contador
- [ ] Crear página `/carrito` con lista completa
- [ ] Integrar botón de carrito en `PrimaryNav`
- [ ] Agregar animaciones y transiciones

### Día 5: Integración con Builder
- [ ] Modificar builder para agregar cajas al carrito
- [ ] Guardar configuración de caja en item del carrito
- [ ] Permitir editar caja desde el carrito
- [ ] Mostrar resumen de caja en carrito

---

## 💳 SEMANA 2: Checkout Profesional

### Día 1-2: Estructura del Checkout
- [ ] Crear página `/checkout` con stepper
- [ ] Paso 1: Revisión de pedido (carrito)
- [ ] Paso 2: Información de entrega
- [ ] Paso 3: Método de pago
- [ ] Paso 4: Confirmación
- [ ] Navegación entre pasos

### Día 3: Formularios y Validación
- [ ] Formulario de dirección con validación
- [ ] Selector de zona de entrega
- [ ] Selector de día/horario de entrega
- [ ] Validación en tiempo real con Zod
- [ ] Manejo de errores amigable

### Día 4-5: Cálculos y Resumen
- [ ] Cálculo automático de subtotal
- [ ] Cálculo de costo de envío por zona
- [ ] Aplicación de descuentos (preparar estructura)
- [ ] Resumen final antes de confirmar
- [ ] Guardado de progreso en localStorage

---

## 💰 SEMANA 3: Integración de Pagos

### Día 1-2: Configuración de Stripe
- [ ] Crear cuenta de Stripe (modo test)
- [ ] Instalar `@stripe/stripe-js` y `stripe`
- [ ] Crear endpoint `/api/payments/create-intent`
- [ ] Crear componente `StripeCheckout` en frontend
- [ ] Configurar variables de entorno

### Día 3: Integración de PayPal
- [ ] Crear cuenta de PayPal Developer
- [ ] Instalar `@paypal/react-paypal-js`
- [ ] Crear componente `PayPalCheckout`
- [ ] Integrar en paso de pago del checkout

### Día 4: Pago Contra Entrega
- [ ] Agregar opción "Pago contra entrega"
- [ ] Lógica para marcar pedido como "pending_payment"
- [ ] Notificación al admin cuando se selecciona
- [ ] UI para esta opción

### Día 5: Procesamiento y Webhooks
- [ ] Crear endpoint `/api/payments/webhook` para Stripe
- [ ] Crear endpoint `/api/payments/webhook` para PayPal
- [ ] Actualizar estado de pedido después de pago
- [ ] Enviar confirmación por email
- [ ] Testing completo del flujo

---

## 🎨 SEMANA 4: Mejoras Visuales Críticas

### Día 1: Hero Section
- [ ] Copiar imagen `greendolio-hero-rainbow-abundance-016.jpg` a `public/images/hero/`
- [ ] Modificar `HeroSection` para usar imagen de fondo
- [ ] Agregar overlay blanco/beige (opacity 0.1-0.2)
- [ ] Ajustar contraste de texto
- [ ] Agregar efecto parallax sutil (opcional)

### Día 2: Sección de Sostenibilidad
- [ ] Copiar `greendolio-seasonal-orange-yellow-002.jpg` a `public/images/hero/`
- [ ] Modificar sección de sostenibilidad en `page.tsx`
- [ ] Agregar imagen de fondo con overlay verde
- [ ] Ajustar contenido para contraste

### Día 3: Cards de Valores
- [ ] Identificar las 3 cards de valores en `page.tsx`
- [ ] Asignar imágenes de fondo a cada card
- [ ] Agregar overlay sutil (opacity 0.05-0.1)
- [ ] Mejorar hover effects
- [ ] Ajustar responsive

### Día 4: Optimización de Imágenes
- [ ] Convertir imágenes críticas a WebP
- [ ] Implementar lazy loading en imágenes
- [ ] Agregar `priority` a imágenes hero
- [ ] Optimizar tamaños de imágenes
- [ ] Verificar Core Web Vitals

### Día 5: Testing y Ajustes Finales
- [ ] Testing en diferentes dispositivos
- [ ] Verificar contraste y accesibilidad
- [ ] Ajustar animaciones y transiciones
- [ ] Optimizar rendimiento
- [ ] Documentar cambios

---

## 🔧 TAREAS PARALELAS (Durante las 4 semanas)

### Backend
- [ ] Crear endpoint `POST /api/orders` para crear pedidos
- [ ] Crear endpoint `GET /api/orders/:id` para ver pedido
- [ ] Actualizar schema de Order para incluir payment info
- [ ] Crear colección `cart` en Firestore (opcional, para sync)

### Frontend - Mejoras Menores
- [ ] Agregar loading states en todas las acciones
- [ ] Mejorar mensajes de error
- [ ] Agregar toasts/notificaciones
- [ ] Mejorar responsive en mobile
- [ ] Agregar skeleton loaders

### Testing
- [ ] Testing manual del flujo completo
- [ ] Testing en diferentes navegadores
- [ ] Testing en dispositivos móviles reales
- [ ] Verificar que no hay errores en consola
- [ ] Verificar accesibilidad básica

---

## 📋 CHECKLIST DE VALIDACIÓN FINAL

Antes de considerar la Fase 1 completa, verificar:

### Funcionalidad
- [ ] Usuario puede agregar productos al carrito
- [ ] Usuario puede agregar cajas personalizadas al carrito
- [ ] Carrito persiste entre sesiones
- [ ] Usuario puede proceder al checkout
- [ ] Checkout tiene todos los pasos funcionando
- [ ] Usuario puede completar un pago (test)
- [ ] Pedido se crea correctamente en Firestore
- [ ] Admin puede ver el pedido en `/admin/orders`

### UX/UI
- [ ] Carrito es fácil de usar y accesible
- [ ] Checkout es intuitivo y claro
- [ ] Formularios tienen validación clara
- [ ] Errores se muestran de forma amigable
- [ ] Loading states están presentes
- [ ] Mobile funciona correctamente

### Visual
- [ ] Hero section se ve profesional
- [ ] Sección de sostenibilidad destaca
- [ ] Cards de valores mejoradas
- [ ] Imágenes optimizadas
- [ ] No hay problemas de contraste

### Técnico
- [ ] No hay errores en consola
- [ ] Performance es aceptable (< 3s carga)
- [ ] Código está limpio y documentado
- [ ] Variables de entorno configuradas
- [ ] Secrets no están en el código

---

## 🎯 CRITERIOS DE ÉXITO

La Fase 1 se considera completa cuando:

1. ✅ Un usuario puede agregar productos/cajas al carrito
2. ✅ El carrito persiste y se puede editar
3. ✅ El checkout funciona end-to-end
4. ✅ Se puede procesar un pago de prueba
5. ✅ El pedido aparece en el admin
6. ✅ Las mejoras visuales están implementadas
7. ✅ Todo funciona en mobile

---

## 📝 NOTAS

- **Priorizar funcionalidad sobre perfección**: Es mejor tener algo funcionando que algo perfecto pero incompleto
- **Testing continuo**: Probar cada feature inmediatamente después de implementarla
- **Mobile first**: Siempre verificar en mobile primero
- **Documentar**: Comentar código complejo y documentar decisiones importantes

---

**Última actualización:** 2025-01-27  
**Siguiente revisión:** Al completar Semana 1

