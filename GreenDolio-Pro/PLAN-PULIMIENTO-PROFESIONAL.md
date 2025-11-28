# ✨ PLAN DE PULIMIENTO PROFESIONAL

**Objetivo:** Dejar la página funcionando 100% de manera profesional  
**Tiempo estimado:** 2-3 días  
**Prioridad:** ALTA - Antes de agregar nuevas funcionalidades

---

## 🔍 DIAGNÓSTICO ACTUAL

### ❌ Problemas Encontrados

1. **Errores de Linting**
   - Variable `RequestPayload` no usada en `boxes/routes.ts`
   - Variable `fileType` no usada en `exportProductMetadata.ts`
   - Variable `error` no usada en `fixImageNames.ts`

2. **Console.logs en Producción**
   - Varios `console.log` en rutas de admin
   - `console.error` en componentes que deberían usar logging apropiado

3. **Textos Inconsistentes**
   - Referencias a "carrito" en textos pero no hay funcionalidad real
   - Placeholders con datos de ejemplo (teléfono, email)

4. **Imágenes Potencialmente Faltantes**
   - Referencias a imágenes que pueden no existir
   - Placeholder images que deberían tener fallbacks reales

5. **SEO Básico**
   - Meta tags básicos pero pueden mejorarse
   - Falta Open Graph tags
   - Falta structured data

---

## 📋 CHECKLIST DE PULIMIENTO

### DÍA 1: Correcciones Técnicas y Limpieza

#### Mañana (4 horas)
- [ ] **Arreglar errores de linting**
  - Remover o usar variable `RequestPayload` en `boxes/routes.ts`
  - Remover o usar variable `fileType` en `exportProductMetadata.ts`
  - Remover o usar variable `error` en `fixImageNames.ts`
  - Ejecutar `npm run lint` y verificar que pase sin warnings

- [ ] **Remover console.logs de producción**
  - Reemplazar `console.log` en rutas admin con logging apropiado
  - Mantener solo `console.error` críticos o reemplazarlos
  - Crear utilidad de logging si es necesario

- [ ] **Limpiar código muerto**
  - Buscar imports no usados
  - Remover funciones/componentes no utilizados
  - Limpiar comentarios obsoletos

#### Tarde (4 horas)
- [ ] **Corregir textos inconsistentes**
  - Revisar todas las referencias a "carrito" y ajustar textos
  - Cambiar textos que prometen funcionalidad no implementada
  - Actualizar placeholders con información real o genérica apropiada
  - Verificar consistencia de tono y mensaje

- [ ] **Verificar imágenes**
  - Listar todas las rutas de imágenes referenciadas
  - Verificar que existan en `public/images/`
  - Crear imágenes placeholder reales si faltan
  - Agregar fallbacks apropiados

---

### DÍA 2: Optimización y Profesionalismo

#### Mañana (4 horas)
- [ ] **SEO Básico Mejorado**
  - Agregar Open Graph tags en `layout.tsx`
  - Agregar Twitter Card tags
  - Agregar structured data (JSON-LD) para Organization y Product
  - Mejorar meta descriptions con keywords relevantes

- [ ] **Optimización de Performance**
  - Verificar que todas las imágenes usen `next/image` correctamente
  - Agregar `priority` a imágenes críticas (hero, above fold)
  - Verificar lazy loading en imágenes below fold
  - Optimizar tamaños de imágenes

#### Tarde (4 horas)
- [ ] **Verificar Links y Navegación**
  - Probar todos los links internos (`#cajas`, `#catalogo`, etc.)
  - Verificar que los anchors funcionen correctamente
  - Probar navegación mobile
  - Verificar que los links externos tengan `target="_blank"` y `rel="noreferrer"`

- [ ] **Responsive Design**
  - Probar en diferentes tamaños de pantalla
  - Verificar que no haya overflow horizontal
  - Verificar que los textos sean legibles en mobile
  - Ajustar spacing y padding en mobile

---

### DÍA 3: Testing y Ajustes Finales

#### Mañana (4 horas)
- [ ] **Testing Funcional**
  - Probar builder de cajas completo
  - Verificar que el formulario de contacto funcione
  - Probar integración con WhatsApp
  - Verificar que el admin panel funcione correctamente

- [ ] **Testing de Navegadores**
  - Probar en Chrome (desktop y mobile)
  - Probar en Safari (desktop y mobile)
  - Probar en Firefox
  - Verificar que no haya errores en consola

#### Tarde (4 horas)
- [ ] **Ajustes Finales**
  - Corregir cualquier bug encontrado
  - Ajustar estilos donde sea necesario
  - Verificar accesibilidad básica (contraste, alt texts)
  - Documentar cambios realizados

- [ ] **Build y Deploy**
  - Ejecutar `npm run build` y verificar que compile sin errores
  - Verificar que no haya warnings en build
  - Preparar para deploy

---

## 🛠️ TAREAS ESPECÍFICAS

### 1. Arreglar Linting

**Archivo:** `apps/api/src/modules/boxes/routes.ts`
```typescript
// Remover o usar RequestPayload
type RequestPayload = z.infer<typeof requestSchema>; // ← Remover si no se usa
```

**Archivo:** `apps/api/src/scripts/exportProductMetadata.ts`
```typescript
// Remover o usar fileType
const fileType = ... // ← Remover si no se usa o renombrar a _fileType
```

**Archivo:** `apps/api/src/scripts/fixImageNames.ts`
```typescript
// Remover o usar error
catch (error) { // ← Cambiar a catch (_error) o usar el error
```

### 2. Remover Console.logs

**Archivo:** `apps/web/src/app/api/admin/catalog/products/[id]/route.ts`
- Remover todos los `console.log` de debug
- Mantener solo logging crítico si es necesario

**Archivo:** `apps/web/src/modules/admin/components/image-upload-field.tsx`
- Revisar `console.error` y decidir si mantener o mejorar

### 3. Corregir Textos

**Archivo:** `apps/web/src/app/page.tsx`
- Línea 648: "agrégalos a tu pedido en el carrito" → Cambiar a "agrégalos a tu pedido por WhatsApp"
- Revisar otros textos similares

**Archivo:** `apps/web/src/app/page.tsx`
- Línea 461: "Cajas protagonistas listas para el carrito" → "Cajas protagonistas listas para pedir"

### 4. Actualizar Información de Contacto

**Archivo:** `apps/web/src/app/page.tsx`
- Línea 822: `+18090000000` → Verificar número real o usar placeholder apropiado
- Línea 832: `hola@greendolio.com` → Verificar email real
- Línea 842: `@green_dolio` → Verificar handle real

**Archivo:** `apps/web/src/app/_components/product-catalog-grid.tsx`
- Línea 13: `WHATSAPP_NUMBER = "18090000000"` → Actualizar con número real

### 5. Verificar Imágenes

**Imágenes críticas a verificar:**
- `/images/logo/logo-vertical.jpg`
- `/images/boxes/box-1-caribbean-fresh-pack-3-dias.jpg`
- `/images/boxes/box-2-island-weekssential-1-semana.jpg`
- `/images/boxes/box-3-allgreenxclusive-2-semanas.jpg`
- `/images/hero/hero-empty-plate.jpg`
- `/images/hero/lifestyle-local-ingredients.jpg`
- `/images/hero/hero-text-space-salad.jpg`
- `/images/hero/hero-mixed-box.jpg`
- `/images/hero/hero-artistic-design.jpg`
- `/images/hero/hero-vegetables-left.jpg`
- `/images/hero/hero-tropical-fruits.jpg`
- `/images/hero/lifestyle-seasonal.jpg`

### 6. Mejorar SEO

**Archivo:** `apps/web/src/app/layout.tsx`
```typescript
export const metadata: Metadata = {
  // ... existente
  openGraph: {
    title: "Green Dolio | De la huerta a tu puerta",
    description: "Cajas frescas de productos locales en República Dominicana",
    url: "https://greendolio.shop",
    siteName: "Green Dolio",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Green Dolio - Productos frescos locales",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Dolio | De la huerta a tu puerta",
    description: "Cajas frescas de productos locales en República Dominicana",
    images: ["/images/og-image.jpg"],
  },
};
```

---

## ✅ CRITERIOS DE ÉXITO

La página está lista cuando:

1. ✅ **Linting limpio**
   - `npm run lint` pasa sin warnings
   - No hay errores de TypeScript

2. ✅ **Sin console.logs**
   - No hay console.logs de debug en producción
   - Solo logging apropiado si es necesario

3. ✅ **Textos consistentes**
   - No hay promesas de funcionalidad no implementada
   - Información de contacto actualizada o genérica apropiada
   - Tonos consistentes

4. ✅ **Imágenes funcionando**
   - Todas las imágenes referenciadas existen
   - Fallbacks apropiados donde sea necesario
   - Optimización básica aplicada

5. ✅ **SEO básico**
   - Meta tags completos
   - Open Graph tags
   - Structured data básico

6. ✅ **Funcionalidad verificada**
   - Todos los links funcionan
   - Formularios funcionan
   - Builder funciona
   - Admin funciona

7. ✅ **Responsive**
   - Se ve bien en mobile
   - Se ve bien en tablet
   - Se ve bien en desktop
   - No hay overflow horizontal

8. ✅ **Sin errores en consola**
   - No hay errores JavaScript
   - No hay warnings críticos
   - No hay errores de imágenes

---

## 📝 NOTAS

- **Priorizar correcciones críticas** sobre mejoras opcionales
- **Mantener funcionalidad existente** mientras se pulen detalles
- **Documentar cambios** para referencia futura
- **Testing continuo** mientras se hacen cambios

---

**Última actualización:** 2025-01-27  
**Estado:** Pendiente de implementación

