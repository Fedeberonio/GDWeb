# Lista de elementos de packaging y precios en el sistema Green Dolio

---

## 1. Datos en código (seed / scripts)

**Archivo:** `scripts/seed-supplies.mjs`

| ID | Nombre | Categoría | Precio unit. (DOP) | Proveedor | Retornable |
|----|--------|-----------|-------------------|-----------|------------|
| botella-jp-litro | Botella JP Litro | Glass | 20.48 | Casa Consuelo | Sí |
| tapa-negra-verde | Tapa Negra Botella Verde | Other | 2.47 | Casa Consuelo | No |
| caja-panificadora-17x13x8 | Caja Panificadora 17x13x8 | Packaging | 1.35 | TodoCartonSK | No |
| caja-8x8x8-swk | Caja 8x8x8 SW K | Packaging | 0.71 | TodoCartonSK | No |

---

## 2. Catálogo de insumos (GREENDOLIO_CATALOGO_INSUMOS.md)

**Archivo:** `GREENDOLIO_CATALOGO_INSUMOS.md` — Propuesta con precios definidos

### 2.1 Cajas y empaques primarios

| ID | Nombre | Precio Unit. | Notas |
|----|--------|--------------|-------|
| caja-box1 | Caja Box 1 Caribbean Fresh Pack | DOP 110 | 3 días |
| caja-box2 | Caja Box 2 Island Weekssential | DOP 110 | 1 semana |
| caja-box3 | Caja Box 3 Allgreenxclusive | DOP 110 | 2 semanas |

### 2.2 Botellas y frascos de vidrio

| ID | Nombre | Precio Unit. | Retornable |
|----|--------|--------------|------------|
| botella-750cc | Botella vidrio 750cc | - | Sí |
| botella-400cc | Botella vidrio 400cc | - | Sí |
| frasco-miel-6.5oz | Frasco miel | - | Sí |
| frasco-miel-12oz | Frasco miel panal | - | No |
| frasco-chimichurri-9.5oz | Frasco chimichurri | - | Sí |

### 2.3 Bolsas de papel kraft

| ID | Nombre | Precio Paquete | Unid/Paquete | Precio Unit. |
|----|--------|----------------|--------------|--------------|
| bolsa-kraft-grande | Bolsa kraft grande #1 | DOP 110 | 20 | DOP 5.50 |
| bolsa-kraft-pequena | Bolsa kraft pequeña con cierre #2 | DOP 62 | 20 | DOP 3.10 |

### 2.4 Contenedores y bowls de cartón kraft

| ID | Nombre | Precio Unit. |
|----|--------|--------------|
| bowl-kraft-16oz | Bowl kraft 16oz | DOP 15 |
| bowl-kraft-13oz | Bowl kraft 13oz | DOP 13 |
| contenedor-ensalada | Contenedor ensalada | DOP 15 |
| vaso-jugo-16oz | Vaso kraft jugos | DOP 8 |
| envase-postre | Envase postre | DOP 5 |

### 2.5 Etiquetas y stickers

En el catálogo no hay precios unitarios definidos; se indica "Cotizar impresión".

---

## 3. Descuento por devolución de envases

**Configuración:** `order-settings.ts` / Admin → Configuración

- **Valor por defecto:** DOP 30
- **Uso:** Si el cliente devuelve envases (returnsPackaging), se aplica este descuento al pedido.
- **Se guarda en:** Firestore `order_settings` o config del proyecto.

---

## 4. Dónde se almacenan los datos en producción

| Fuente | Ubicación |
|--------|-----------|
| Insumos (packaging, botellas, etc.) | Firestore `catalog_supplies` |
| Configuración (descuento devolución) | Firestore `order_settings` o config del proyecto |
| Admin UI | `/admin/supplies` — lista y edita insumos con `unitPrice` |

---

## 5. Resumen de precios con valor definido

| Elemento | Precio (DOP) |
|----------|--------------|
| Botella JP Litro | 20.48 |
| Tapa Negra Botella Verde | 2.47 |
| Caja Panificadora 17x13x8 | 1.35 |
| Caja 8x8x8 SW K | 0.71 |
| Caja Box 1 Caribbean Fresh Pack | 110 |
| Caja Box 2 Island Weekssential | 110 |
| Caja Box 3 Allgreenxclusive | 110 |
| Bolsa kraft grande (unidad) | 5.50 |
| Bolsa kraft pequeña (unidad) | 3.10 |
| Bowl kraft 16oz | 15 |
| Bowl kraft 13oz | 13 |
| Contenedor ensalada | 15 |
| Vaso kraft jugos | 8 |
| Envase postre | 5 |
| Descuento devolución envases | 30 |

---

**Nota:** Los precios reales en producción pueden diferir de los del catálogo si se han actualizado desde el Admin (`/admin/supplies`). Para ver los valores actuales, consultar Firestore `catalog_supplies` o la pantalla de admin.
