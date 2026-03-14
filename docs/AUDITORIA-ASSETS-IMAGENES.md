# Auditoría de assets e imágenes del proyecto (web + admin)

**Objetivo:** Radiografía completa de dónde están los assets, cómo se referencian y para qué se usan, para que un data manager pueda estandarizar nombres, carpetas y convenciones.  
**Alcance:** `apps/web` (Next.js). No se han modificado archivos; solo inventario y uso.

---

## 1. Resumen ejecutivo

| Concepto | Valor |
|----------|--------|
| **Raíz de assets públicos** | `apps/web/public/` |
| **Ruta URL base** | `/assets/images/` (desde `public/assets/images/`) |
| **Total archivos de imagen listados** | ~162 (png, jpg, jpeg, webp, svg, gif) |
| **Carpetas principales bajo `public/assets/images/`** | `boxes/`, `categories/`, `combos/`, `hero/`, `how it works/`, `icons/`, `logo/`, `products/` |
| **Assets referenciados pero no encontrados en repo** | `boxes/placeholder.jpg`, `combos/placeholder.png`, `categories/Gemini_Generated_Image_5cai8k5cai8k5cai.png` |
| **Inconsistencias de ruta** | Carpeta `how it works` (espacio): en código se usa tanto `how it works` como `how%20it%20works` |

---

## 2. Estructura de carpetas y archivos

### 2.1 Raíz `apps/web/public/`

| Archivo | Uso en proyecto |
|---------|------------------|
| `file.svg` | (genérico; no referenciado en código revisado) |
| `globe.svg` | (genérico) |
| `next.svg` | (por defecto Next.js) |
| `vercel.svg` | (por defecto Vercel) |
| `window.svg` | (genérico) |

**Nota:** Next.js App Router usa además `apps/web/src/app/icon.png` y `apps/web/src/app/favicon.ico` para favicon/icono de app (ruta `/icon.png` en build). El metadata del layout apunta a `/assets/images/logo/favicon.png` para `icons.icon` y `icons.apple`.

---

### 2.2 `public/assets/images/`

Toda la lógica de imágenes de producto, cajas, combos, categorías, hero y logo vive aquí. Las URLs en el código son del tipo `/assets/images/<carpeta>/<archivo>`.

---

#### 2.2.1 `public/assets/images/boxes/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `GD-CAJA-001.png` | PNG | Caja 1: grid home, modal personalizar, quick-add, cart, box-preview, guided-flow, add-box-to-cart, admin box-grid-manager, admin layout (logo sidebar) |
| `GD-CAJA-001-topdown.png` | PNG | Vista “topdown” en boxes-grid, box-customize-modal, quick-add-modal |
| `GD-CAJA-002.jpg` | JPG | Caja 2: mismos usos que caja 1 |
| `GD-CAJA-002-topdown.png` | PNG | Vista topdown caja 2 |
| `GD-CAJA-003.jpg` | JPG | Caja 3: mismos usos; también logo/sidebar admin y dashboard admin |
| `GD-CAJA-003-topdown.png` | PNG | Vista topdown caja 3 |
| **`placeholder.jpg`** | **(referenciado, no existe en repo)** | Fallback en boxes-grid, box-customize-modal, quick-add-modal, armar, guided-box-flow, discover-box-view, box-preview, add-box-to-cart; onerror en box-customize-modal |

**Observaciones:**  
- Mezcla de extensiones por caja: 001 en `.png`, 002 y 003 en `.jpg`. En código hay mapas fijos por ID (`GD-CAJA-001` → `.png`, 002/003 → `.jpg`) y fallbacks `/${id}.jpg` y `/${slug}.png`.  
- No hay archivo físico `placeholder.jpg` en `boxes/`; si falla la carga se usa esa URL y queda rota.

---

#### 2.2.2 `public/assets/images/categories/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `Frutas.png` | PNG | category-card, unified-catalog-section, category-product-grid, category-highlight-section |
| `Vegetales.png` | PNG | Idem |
| `Jugos.png` | PNG | Idem |
| `productos_caseros.png` | PNG | Idem (minúsculas con underscore) |
| `Productos_de_granja.png` | PNG | Idem (P mayúscula, resto minúsculas) |
| `hierbas_y_especias.png` | PNG | Idem (minúsculas) |
| `Otros.png` | PNG | Idem |
| **`Gemini_Generated_Image_5cai8k5cai8k5cai.png`** | **(referenciado, no existe en repo)** | category-card (slug "cajas"), category-highlight-section (cajas) |

**Observaciones:**  
- Nomenclatura mixta: PascalCase (`Frutas`, `Jugos`, `Vegetales`, `Otros`, `Productos_de_granja`) y snake_case en minúsculas (`productos_caseros`, `hierbas_y_especias`).  
- La imagen de “cajas” apunta a un archivo Gemini que no está en el repo.

---

#### 2.2.3 `public/assets/images/combos/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `GD-COMB-001.png` … `GD-COMB-007.png` | PNG | lunch-combos-section (lista fija por combo); admin combo-manager (preview por ID con patrón `GD-COMB-${padded}.png` o `${comboId}.png`) |
| **`placeholder.png`** | **(referenciado, no existe en repo)** | lunch-combos-section: fallback cuando `combo.image` no está |

**Observaciones:**  
- Convención de nombres consistente: `GD-COMB-NNN.png`.  
- Falta asset físico para placeholder de combos.

---

#### 2.2.4 `public/assets/images/hero/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `hero-rainbow-abundance.jpg` | JPG | hero-section, hero-section-client; fallback en category-product-grid y unified-catalog-section |
| `hero-mixed-box.jpg` | JPG | category-highlight-section (default y card) |
| `lifestyle-local-ingredients.jpg` | JPG | home-sections |
| `hero-welcome-banner.png` | PNG | logo-splash |
| `hero-artistic-design.jpg` | JPG | (en disco; no referenciado en grep) |
| `hero-empty-plate.jpg` | JPG | (en disco) |
| `hero-gourmet-variety.jpg` | JPG | (en disco) |
| `hero-lifestyle-01.jpg` | JPG | (en disco) |
| `hero-text-space-salad.jpg` | JPG | (en disco) |
| `hero-tropical-fruits.jpg` | JPG | (en disco) |
| `hero-vegetables-left.jpg` | JPG | (en disco) |
| `lifestyle-seasonal.jpg` | JPG | (en disco) |

**Observaciones:**  
- Prefijo `hero-` o `lifestyle-`; algunos archivos no tienen referencias en el código actual.

---

#### 2.2.5 `public/assets/images/how it works/` (nombre de carpeta con espacio)

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `step-1.jpg` … `step-5.jpg` | JPG | how-it-works-accordion (rutas con espacio URL-encoded: `/assets/images/how%20it%20works/step-N.jpg`) |
| `how-it-works-es.png` | PNG | how-it-works-image (locale ES) |
| `how-it-works-en.png` | PNG | how-it-works-image (locale EN) |

**Observaciones:**  
- Carpeta con espacio en el nombre. En un archivo se usa `how it works` (espacio) y en otro `how%20it%20works`; ambos resuelven al mismo directorio pero la convención no es única.  
- Nombres estandarizados (how-it-works-es/en) y steps numéricos.

---

#### 2.2.6 `public/assets/images/icons/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `icon-like.png` | PNG | (en disco; no referenciado en grep en src) |
| `icon-dislike.png` | PNG | (en disco) |

**Observaciones:**  
- PascalCase; uso en UI no localizado en esta auditoría.

---

#### 2.2.7 `public/assets/images/logo/`

| Archivo | Formato | Uso en web / admin |
|---------|---------|---------------------|
| `favicon.png` | PNG | layout.tsx (metadata: icons.icon, icons.apple) |
| `logo-vertical.png` | PNG | footer, primary-nav |
| `logo-principal-large.png` | PNG | hero-section |
| `logo-horizontal.png` | PNG | (en disco) |
| `logo-principal.png` | PNG | (en disco) |
| `logo-simplificado.png` | PNG | (en disco) |

**Observaciones:**  
- Nomenclatura clara (vertical, principal-large, etc.).  
- Favicon es el único logo referenciado en metadata; el resto en componentes de layout/hero/footer.

---

#### 2.2.8 `public/assets/images/products/`

Más de un centenar de archivos. Patrones observados:

- **SKU tipo GD-XXX-NNN:** p. ej. `GD-FRUT-024.png`, `GD-VEGE-054.png`, `GD-ING-001.png`, `GD-JUGO-008.png`, `GD-GRAN-012.png`, `GD-CASE-004.png`, `GD-HIER-070.png`, `GD-OTRO-017.png`.  
  Uso: catálogo, box builder, admin productos; la URL se construye por SKU/id/slug en `modules/catalog/api.ts`, `product-images.ts`, `product-image-fallback.tsx`, `product-grid-manager.tsx`, `product-edit-drawer.tsx`, etc. Extensiones probadas en código: `.png`, `.jpg`, `.jpeg` (y en swap-product-modal también `.PNG`).
- **Nombres “opacos”:** p. ej. `temp-unknown-product-1.png`, `temp-unknown-product-2.png` (posiblemente IDs de Firebase/upload).  
  Uso: mismo flujo que productos por SKU si el documento tiene ese valor en `image` o como identificador.
- **`placeholder.png`** | PNG | product-image-fallback, swap-product-modal (fallback cuando no hay imagen).

**Dónde se usa en código (resumen):**

- **Web:** catálogo, categorías, box builder (product gallery, swap modal), cart, quick-add, discover-box-view, product-card, category-product-grid.  
- **Admin:** product-manager, product-grid-manager, product-edit-drawer; upload de imagen escribe en `public/assets/images/products/` o `boxes/` (según SKU/categoría) y normaliza a `.png` (`api/admin/upload-image/route.ts`).

**Observaciones:**  
- Mezcla de convención “SKU.png” con nombres opacos.  
- La API de upload guarda siempre como `${normalizedSku}.png` en `products/` o `boxes/`.

---

## 3. Mapa de referencias por tipo de uso

### 3.1 Web (páginas públicas y componentes compartidos)

| Componente / archivo | Rutas de assets que usa |
|----------------------|--------------------------|
| `boxes-grid.tsx` | `/assets/images/boxes/GD-CAJA-001.png`, 002/003 (.jpg), *-topdown.png, placeholder.jpg |
| `box-customize-modal.tsx` | Igual que boxes-grid + fallback por box.slug (.jpg, .png) y placeholder.jpg |
| `quick-add-modal.tsx` | Mismo mapa de cajas y placeholder.jpg |
| `guided-box-flow.tsx` | GD-CAJA-001/002/003, placeholder.jpg |
| `box-selector/box-preview.tsx` | GD-CAJA-001/002/003, placeholder.jpg |
| `cart-drawer.tsx` | GD-CAJA-001/002/003 |
| `add-box-to-cart-button.tsx` | GD-CAJA-001/002/003, placeholder.jpg |
| `box-builder/discover-box-view.tsx` | Productos: `/assets/images/products/${key}.png`; cajas: placeholder.jpg |
| `box-builder/swap-product-modal.tsx` | Productos: .png, .PNG, .jpg; placeholder.png; greendolio.shop fallback |
| `product-image-fallback.tsx` | products: .png, .jpg, .jpeg; boxes: .png, .jpg; placeholder.png |
| `product-catalog-grid.tsx` | products: `${imageKey}.png` |
| `categoria/.../category-product-grid.tsx` | categories: Frutas, Vegetales, productos_caseros, Productos_de_granja, Jugos, hierbas_y_especias, Otros; hero-rainbow-abundance.jpg; products |
| `category-card.tsx` | categories (incl. Gemini_Generated_Image... para "cajas") |
| `unified-catalog-section.tsx` | categories + hero-rainbow-abundance.jpg |
| `category-highlight-section.tsx` | categories + hero-mixed-box.jpg |
| `lunch-combos-section.tsx` | /assets/images/combos/GD-COMB-001…007.png, placeholder.png |
| `hero-section.tsx` | hero-rainbow-abundance.jpg, logo-principal-large.png |
| `hero-section-client.tsx` | hero-rainbow-abundance.jpg |
| `logo-splash.tsx` | hero-welcome-banner.png |
| `home-sections.tsx` | lifestyle-local-ingredients.jpg |
| `how-it-works-accordion.tsx` | /assets/images/how%20it%20works/step-1.jpg … step-5.jpg |
| `how-it-works-image.tsx` | /assets/images/how-it-works/how-it-works-es.png, how-it-works-en.png |
| `footer.tsx` | logo-vertical.png |
| `primary-nav.tsx` | logo-vertical.png |
| `armar/page.tsx` | boxes placeholder.jpg o heroImage de caja |

### 3.2 Admin

| Componente / archivo | Rutas de assets que usa |
|----------------------|--------------------------|
| `admin/layout.tsx` | /assets/images/boxes/GD-CAJA-003.jpg (logo sidebar) |
| `admin/page.tsx` | GD-CAJA-003.jpg, arroz-blanco.jpg (products), GD-CAJA-001.png, GD-CAJA-002.jpg (cards) |
| `admin/catalog/box-grid-manager.tsx` | GD-CAJA-001.png, 002/003.jpg; heroImage desde /assets/images/boxes/; fallback ${box.id}.jpg |
| `admin/catalog/box-edit-drawer.tsx` | preview /assets/images/boxes/${box.id}.png |
| `admin/catalog/box-manager.tsx` | Placeholder de texto para URL boxes |
| `admin/catalog/product-grid-manager.tsx` | /assets/images/products/${sku}.png o ${id}.png |
| `admin/catalog/product-manager.tsx` | Placeholder de texto para URL products |
| `admin/catalog/product-edit-drawer.tsx` | Lógica por SKU: cajas GD-CAJA-001 (.png), 002/003 (.jpg), resto products/${sku}.png |
| `admin/catalog/combo-manager.tsx` | /assets/images/combos/GD-COMB-${padded}.png o ${comboId}.png; placeholder de texto |
| `api/admin/upload-image/route.ts` | Escribe en public/assets/images/products/ o boxes/ como .png |

**Nota:** En admin dashboard se usa “arroz-blanco.jpg” en una card; en `public/assets/images/products/` no aparece ese nombre en el listado (solo SKUs tipo GD-* y nombres opacos), por lo que podría ser una referencia legacy o a otro path.

---

## 4. Convenciones actuales (implícitas)

- **Cajas:** ID fijo (GD-CAJA-001, 002, 003). 001 en PNG; 002 y 003 en JPG. Variante “topdown” siempre PNG.  
- **Combos:** GD-COMB-NNN.png.  
- **Productos:** Principalmente SKU (GD-XXX-NNN) + .png; en fallbacks se prueban .jpg y .jpeg. Algunos archivos con nombre opaco (IDs).  
- **Categorías:** Nombres legibles; mezcla PascalCase y snake_case.  
- **Hero:** prefijos `hero-` o `lifestyle-`; varios no referenciados.  
- **Logo:** favicon.png para metadata; logo-vertical, logo-principal-large en UI.  
- **Placeholders:** products → `placeholder.png`; boxes → `placeholder.jpg`; combos → `placeholder.png`. Solo products/placeholder.png existe en repo.

---

## 5. Problemas detectados (para data manager)

1. **Assets referenciados y no presentes:**  
   - `public/assets/images/boxes/placeholder.jpg`  
   - `public/assets/images/combos/placeholder.png`  
   - `public/assets/images/categories/Gemini_Generated_Image_5cai8k5cai8k5cai.png`

2. **Nombre de carpeta con espacio:** `how it works` provoca doble forma de referencia (`how it works` vs `how%20it%20works`).

3. **Nomenclatura de categorías:** Mezcla de mayúsculas/minúsculas y guiones bajos (Frutas vs productos_caseros vs Productos_de_granja).

4. **Cajas:** Mezcla .png (001) y .jpg (002, 003); código tiene lógica especial por ID.

5. **Productos:** Mezcla de nombres por SKU (GD-XXX-NNN) y nombres opacos (posibles IDs de upload); extensión asumida .png por defecto pero se prueban .jpg/.jpeg en fallbacks.

6. **Referencia externa:** swap-product-modal usa `https://greendolio.shop/assets/images/products/...` como fallback; dominio está en next.config como remotePatterns.

7. **Hero:** Varios JPG en disco sin referencia en código; posible contenido obsoleto o pendiente de uso.

---

## 6. Propuesta de mejoras (solo recomendaciones; no aplicadas)

- **Placeholders:** Crear y subir `boxes/placeholder.jpg` y `combos/placeholder.png` (o unificar en una sola imagen de placeholder por tipo y actualizar referencias).  
- **Categoría “cajas”:** Añadir `Gemini_Generated_Image_5cai8k5cai8k5cai.png` al repo o sustituir la referencia por un archivo con nombre descriptivo (p. ej. `cajas.png`) y actualizar código.  
- **Carpeta “how it works”:** Renombrar a `how-it-works` (sin espacio) y actualizar todas las referencias a `/assets/images/how-it-works/...` para evitar espacios y %20.  
- **Categorías:** Estandarizar nombres de archivo (p. ej. todo kebab-case o todo snake_case) y un solo criterio de mayúsculas (p. ej. slug: `frutas` → `frutas.png`).  
- **Cajas:** Unificar extensión (p. ej. todo .webp o .png) y un solo mapa en un módulo compartido para evitar duplicar el objeto en varios componentes.  
- **Productos:** Documentar que los nombres opacos son IDs de upload; decidir si se renombran a SKU cuando exista o se mantienen y se referencian solo vía campo `image` en BD.  
- **Hero:** Revisar qué imágenes se usan; mover las no usadas a una carpeta `_unused` o eliminarlas para no confundir.  
- **Logo:** Confirmar si favicon debe ser el de `logo/` o el de `src/app/icon.png`/favicon.ico y dejar una única fuente de verdad en metadata.

---

**Documento generado como auditoría únicamente; no se ha modificado ningún archivo del proyecto.**
