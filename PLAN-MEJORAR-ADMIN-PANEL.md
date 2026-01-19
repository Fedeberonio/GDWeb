# Plan: Mejorar Panel de Administración - Edición Completa

## Problema Identificado

El panel de administración actual tiene limitaciones en la edición de campos:

1. **Cajas (BoxManager)**: Solo permite editar: precio, descripción, imagen, destacado, duración
   - ❌ Falta: nombre (es/en)
   - ❌ Falta: variantes (contenido, nombres, descripciones, highlights)

2. **Reglas de Cajas (BoxRulesManager)**: Solo permite editar JSON completo
   - ❌ Falta: campos individuales para cada propiedad
   - ❌ Falta: editor visual para contenido base y por variante

3. **Productos (ProductManager)**: Parece completo, pero falta verificar SKU editable

## Soluciones

### 1. Mejorar BoxManager - Agregar campos faltantes

**Archivo:** `apps/web/src/modules/admin/catalog/components/box-manager.tsx`

**Cambios necesarios:**

1. **Agregar campos de nombre:**
   - `nameEs` y `nameEn` al FormState
   - Inputs para editar nombres en ambos idiomas
   - Incluir en el payload al guardar

2. **Agregar editor de variantes:**
   - Sección expandible/colapsable para cada variante
   - Para cada variante, campos para:
     - Nombre (ES y EN)
     - Descripción (ES y EN)
     - Highlights (array de strings localizados)
     - Reference Contents (array de productos con cantidades)
   - Botones para agregar/eliminar variantes (opcional, puede ser solo edición)

**Estructura del FormState actualizado:**
```typescript
type FormState = {
  nameEs: string;
  nameEn: string;
  priceAmount: string;
  descriptionEs: string;
  descriptionEn: string;
  heroImage: string;
  isFeatured: boolean;
  durationDays: string;
  variants: Array<{
    id: string;
    slug: string;
    nameEs: string;
    nameEn: string;
    descriptionEs: string;
    descriptionEn: string;
    highlights: Array<{ es: string; en: string }>;
    referenceContents: Array<{
      productId?: string;
      nameEs: string;
      nameEn: string;
      quantity?: string;
    }>;
  }>;
};
```

### 2. Mejorar BoxRulesManager - Campos individuales

**Archivo:** `apps/web/src/modules/admin/catalog/components/box-rules-manager.tsx`

**Cambios necesarios:**

1. **Reemplazar editor JSON por campos individuales:**
   - `displayName` (input text)
   - `slotBudget` (input number)
   - `targetWeightKg` (input number)
   - `minMargin` (input number, opcional)

2. **Editor de categoryBudget:**
   - Mantener como JSON editor (es complejo) o crear una tabla/lista editable
   - Opción: mantener JSON pero con mejor formato y validación

3. **Editor de baseContents:**
   - Lista de productos con cantidades
   - Agregar/eliminar items
   - Selector de productos con búsqueda
   - Campo de cantidad numérico

4. **Editor de variantContents:**
   - Tabs o secciones para: mix, fruity, veggie
   - Cada sección tiene su propia lista de productos (similar a baseContents)

**Estructura del FormState:**
```typescript
type FormState = {
  displayName: string;
  slotBudget: string;
  targetWeightKg: string;
  minMargin: string;
  categoryBudget: string; // JSON string para edición
  baseContents: Array<{ productSlug: string; quantity: string }>;
  variantContents: {
    mix?: Array<{ productSlug: string; quantity: string }>;
    fruity?: Array<{ productSlug: string; quantity: string }>;
    veggie?: Array<{ productSlug: string; quantity: string }>;
  };
};
```

### 3. Verificar y agregar SKU en ProductManager

**Archivo:** `apps/web/src/modules/admin/catalog/components/product-manager.tsx`

**Cambios necesarios:**
- Agregar campo `sku` al FormState si no existe
- Agregar input para editar SKU
- Incluir en el payload al guardar

## Archivos a Modificar

1. `apps/web/src/modules/admin/catalog/components/box-manager.tsx`
   - Agregar campos de nombre
   - Agregar editor de variantes

2. `apps/web/src/modules/admin/catalog/components/box-rules-manager.tsx`
   - Reemplazar editor JSON por campos individuales
   - Agregar editores visuales para contenido

3. `apps/web/src/modules/admin/catalog/components/product-manager.tsx`
   - Verificar y agregar campo SKU si falta

4. `apps/api/src/modules/catalog/service.ts`
   - Verificar que `boxUpdateSchema` soporte todos los campos (ya parece estar bien)
   - Verificar que `boxRuleUpdateSchema` soporte actualizaciones parciales

## Consideraciones

- **Variantes de cajas**: Puede ser complejo editar todas las variantes. Considerar:
  - Editor expandible por variante
  - O mantener solo edición de nombres y descripciones principales
  - El contenido de referencia puede ser más complejo de editar visualmente

- **BoxRules**: El contenido puede ser muy complejo. Opciones:
  - Mantener JSON pero con mejor UI (syntax highlighting, validación)
  - O crear editores visuales para cada sección

- **UX**: Organizar los campos en secciones colapsables para mejor usabilidad

## Resultado Esperado

- Todas las propiedades de cajas editables desde el panel
- Reglas de cajas editables con campos individuales (o mejor UI para JSON)
- Productos con todos los campos editables incluyendo SKU
- Mejor experiencia de usuario en el panel de administración
