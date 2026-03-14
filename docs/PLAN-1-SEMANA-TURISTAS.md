# 🚀 PLAN DE ACCIÓN: 1 SEMANA - Combos y Ensaladas para Turistas

**Objetivo:** Crear combos nuevos, ensaladas y productos destacados para grupos de turistas  
**Tiempo:** 7 días  
**Prioridad:** CRÍTICA - Acceso privilegiado a turistas el próximo mes

---

## 🎯 OBJETIVOS ESPECÍFICOS

1. ✅ Crear sistema rápido de combos desde admin
2. ✅ Agregar ensaladas como productos especiales
3. ✅ Sección destacada "Para Turistas" en homepage
4. ✅ Traducción al inglés (ya tienen estructura)
5. ✅ Formulario rápido de pedido para grupos

---

## 📅 CRONOGRAMA DÍA A DÍA

### DÍA 1 (Lunes): Estructura de Combos y Ensaladas

#### Mañana (4 horas)
- [ ] **Crear categoría "combos" en Firestore**
  - Agregar categoría "combos" con descripción bilingüe
  - Agregar categoría "ensaladas" con descripción bilingüe
  - Usar admin panel existente o script rápido

- [ ] **Extender schema de Product para combos**
  - Agregar campo `comboItems?: Array<{productId: string, quantity: number}>`
  - Agregar campo `servesPeople?: number` (para combos de grupos)
  - Agregar tag automático "tourist" cuando se crea combo

#### Tarde (4 horas)
- [ ] **Crear componente de creación rápida de combos**
  - Formulario en `/admin/combos` (nueva página)
  - Selector de productos múltiples
  - Cálculo automático de precio total
  - Vista previa del combo

- [ ] **Script para crear combos desde admin**
  - Endpoint `POST /api/admin/catalog/combos`
  - Validación de productos existentes
  - Generación automática de slug y descripción

---

### DÍA 2 (Martes): Ensaladas y Productos Especiales

#### Mañana (4 horas)
- [ ] **Crear ensaladas como productos**
  - Usar categoría "ensaladas"
  - Agregar campo `ingredients: string[]` en descripción
  - Tag "fresh" y "healthy" automático
  - Precio por porción individual y combo familiar

- [ ] **Template de ensaladas populares**
  - Ensalada Tropical (mango, aguacate, lechuga)
  - Ensalada Mediterránea (tomate, pepino, aceitunas)
  - Ensalada Caribeña (piña, coco, vegetales mixtos)
  - Crear desde admin con un clic

#### Tarde (4 horas)
- [ ] **Mejorar formulario de creación de productos**
  - Agregar checkbox "Es combo"
  - Agregar selector de productos incluidos
  - Agregar campo "Sirve para X personas"
  - Agregar checkbox "Destacar para turistas"

- [ ] **Bulk creation de combos predefinidos**
  - Script para crear 5-10 combos populares
  - Combos para 2, 4, 6, 8 personas
  - Precios precalculados

---

### DÍA 3 (Miércoles): Sección "Para Turistas" en Homepage

#### Mañana (4 horas)
- [ ] **Crear componente `TouristSection`**
  - Sección destacada después del hero
  - Grid de combos y ensaladas
  - Badge "Perfect for Tourists" / "Perfecto para Turistas"
  - Filtro por número de personas

- [ ] **Integrar en homepage**
  - Agregar después de hero section
  - Mostrar solo productos con tag "tourist" o categoría "combos"/"ensaladas"
  - Diseño atractivo con imágenes grandes

#### Tarde (4 horas)
- [ ] **Mejorar cards de productos para combos**
  - Mostrar "Serves X people" / "Para X personas"
  - Lista de productos incluidos
  - Precio por persona destacado
  - Botón grande "Order for Group" / "Pedir para Grupo"

- [ ] **Traducción rápida al inglés**
  - Usar estructura existente `name: {es, en}`
  - Traducir nombres de combos y ensaladas
  - Traducir descripciones básicas

---

### DÍA 4 (Jueves): Formulario de Pedido Rápido para Grupos

#### Mañana (4 horas)
- [ ] **Crear página `/pedido-grupo` o `/group-order`**
  - Formulario simplificado para grupos
  - Campos: nombre, email, teléfono, número de personas, fecha
  - Selector de combos/ensaladas
  - Cálculo automático de total

- [ ] **Integración con WhatsApp mejorada**
  - Mensaje pre-formateado con todos los detalles
  - Incluir número de personas
  - Incluir fecha preferida
  - Incluir lista completa de productos

#### Tarde (4 horas)
- [ ] **Sistema de notificaciones**
  - Email automático al admin cuando hay pedido de grupo
  - Template de email con todos los detalles
  - Integración con SendGrid o servicio similar (rápido)

- [ ] **Mejoras visuales**
  - Diseño atractivo para turistas
  - Imágenes de productos en contexto (grupos disfrutando)
  - Colores llamativos pero profesionales

---

### DÍA 5 (Viernes): Optimización y Contenido

#### Mañana (4 horas)
- [ ] **Agregar imágenes de combos**
  - Crear/seleccionar imágenes para cada combo
  - Imágenes de ensaladas preparadas
  - Optimizar tamaños y formatos
  - Subir a Firebase Storage

- [ ] **Contenido SEO básico**
  - Meta descriptions para sección de turistas
  - Títulos atractivos
  - Descripciones en inglés y español

#### Tarde (4 horas)
- [ ] **Testing completo**
  - Probar creación de combos desde admin
  - Probar formulario de pedido
  - Probar integración WhatsApp
  - Verificar traducciones
  - Testing en mobile

- [ ] **Ajustes finales**
  - Corregir bugs encontrados
  - Mejorar UX donde sea necesario
  - Optimizar carga de imágenes

---

### DÍA 6 (Sábado): Contenido y Marketing

#### Todo el día (8 horas)
- [ ] **Crear 10-15 combos predefinidos**
  - Combos para 2 personas (romántico)
  - Combos para 4 personas (familia pequeña)
  - Combos para 6-8 personas (grupos)
  - Combos temáticos (tropical, mediterráneo, caribeño)

- [ ] **Crear 5-7 ensaladas**
  - Ensaladas individuales
  - Ensaladas familiares (4-6 personas)
  - Ensaladas con proteína (opcional)

- [ ] **Fotos y descripciones**
  - Escribir descripciones atractivas
  - Agregar ingredientes destacados
  - Precios competitivos

---

### DÍA 7 (Domingo): Lanzamiento y Documentación

#### Mañana (4 horas)
- [ ] **Deploy a producción**
  - Verificar que todo funciona
  - Deploy de frontend y backend
  - Verificar variables de entorno

- [ ] **Crear guía rápida para admin**
  - Cómo crear un combo nuevo
  - Cómo crear una ensalada
  - Cómo marcar productos para turistas
  - Cómo responder pedidos de grupos

#### Tarde (4 horas)
- [ ] **Materiales de marketing**
  - Crear link directo para turistas: `/tourists` o `/grupos`
  - QR code para compartir fácilmente
  - Mensaje de WhatsApp pre-formateado para compartir

- [ ] **Monitoreo inicial**
  - Configurar analytics básico
  - Verificar que los pedidos llegan correctamente
  - Listo para recibir turistas

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA RÁPIDA

### 1. Extender Schema de Product (Día 1)

```typescript
// En apps/api/src/modules/catalog/schemas.ts
export const productSchema = z.object({
  // ... campos existentes
  comboItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
  servesPeople: z.number().int().positive().optional(),
  isTouristFriendly: z.boolean().default(false),
});
```

### 2. Crear Categorías (Día 1)

```typescript
// Script rápido para crear categorías
const combosCategory = {
  id: "combos",
  slug: "combos",
  name: { es: "Combos para Grupos", en: "Group Combos" },
  description: { es: "Combos especiales para grupos y turistas", en: "Special combos for groups and tourists" },
  sortOrder: 0,
  status: "active",
};

const ensaladasCategory = {
  id: "ensaladas",
  slug: "ensaladas",
  name: { es: "Ensaladas Frescas", en: "Fresh Salads" },
  description: { es: "Ensaladas preparadas con ingredientes locales", en: "Fresh salads with local ingredients" },
  sortOrder: 1,
  status: "active",
};
```

### 3. Componente TouristSection (Día 3)

```typescript
// apps/web/src/app/_components/tourist-section.tsx
export function TouristSection({ combos, ensaladas }: Props) {
  // Mostrar productos con tag "tourist" o categorías "combos"/"ensaladas"
  // Diseño atractivo con badges y precios por persona
}
```

### 4. Página de Pedido para Grupos (Día 4)

```typescript
// apps/web/src/app/pedido-grupo/page.tsx
// Formulario simplificado con:
// - Información de contacto
// - Número de personas
// - Selección de combos/ensaladas
// - Fecha preferida
// - Botón que genera mensaje de WhatsApp
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Antes del lanzamiento, verificar:

### Funcionalidad
- [ ] Se pueden crear combos desde admin
- [ ] Se pueden crear ensaladas desde admin
- [ ] Los productos aparecen en sección "Para Turistas"
- [ ] El formulario de pedido funciona
- [ ] WhatsApp se abre con mensaje correcto
- [ ] Las traducciones al inglés están completas

### Contenido
- [ ] Hay al menos 10 combos creados
- [ ] Hay al menos 5 ensaladas creadas
- [ ] Todos tienen imágenes
- [ ] Todos tienen descripciones atractivas
- [ ] Precios están configurados

### UX
- [ ] Sección de turistas es visible y atractiva
- [ ] Formulario es fácil de usar
- [ ] Mobile funciona correctamente
- [ ] Las imágenes cargan rápido

---

## 🎨 DISEÑO RÁPIDO PARA TURISTAS

### Colores y Estilo
- Usar badges verdes "Perfect for Tourists"
- Destacar precios por persona
- Imágenes grandes y atractivas
- Texto bilingüe prominente

### Sección en Homepage
```
[HERO SECTION]
↓
[SECCIÓN "PARA TURISTAS" / "FOR TOURISTS"]
  - Título grande bilingüe
  - Grid de combos destacados
  - Filtro por número de personas
  - CTA: "Order for Your Group" / "Pedir para tu Grupo"
↓
[Resto del contenido...]
```

---

## 💡 IDEAS DE COMBOS PARA TURISTAS

### Combos Temáticos
1. **Combo Tropical** (4 personas)
   - Mango, piña, coco, aguacate, lechuga
   - RD$ 1,200

2. **Combo Caribeño** (6 personas)
   - Productos locales de temporada
   - Incluye hierbas frescas
   - RD$ 1,800

3. **Combo Romántico** (2 personas)
   - Frutas exóticas y vegetales premium
   - RD$ 800

4. **Combo Familiar** (8 personas)
   - Mix completo de frutas y vegetales
   - RD$ 2,400

### Ensaladas
1. **Ensalada Tropical** - Mango, aguacate, lechuga, aderezo especial
2. **Ensalada Mediterránea** - Tomate, pepino, aceitunas, queso
3. **Ensalada Caribeña** - Piña, coco, vegetales mixtos
4. **Ensalada de la Casa** - Mix de productos locales de temporada

---

## 🚀 DEPLOY RÁPIDO

### Checklist Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Firebase configurado
- [ ] Imágenes subidas a Storage
- [ ] Categorías creadas
- [ ] Combos y ensaladas creados
- [ ] Traducciones completas
- [ ] Testing básico realizado

### Post-Deploy
- [ ] Verificar que todo carga correctamente
- [ ] Probar formulario de pedido
- [ ] Verificar WhatsApp
- [ ] Compartir link con equipo
- [ ] Preparar materiales de marketing

---

## 📞 SOPORTE POST-LANZAMIENTO

### Primera Semana
- Monitorear pedidos diariamente
- Responder rápidamente a consultas
- Ajustar precios si es necesario
- Agregar más combos según demanda

### Materiales Necesarios
- Link directo: `greendolio.shop/tourists` o `/grupos`
- QR code para compartir
- Mensaje de WhatsApp pre-formateado
- Email template para confirmaciones

---

**¡Listo para recibir turistas en 1 semana!** 🎉

